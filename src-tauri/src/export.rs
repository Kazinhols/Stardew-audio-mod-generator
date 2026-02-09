use crate::{AudioEntry, ExportResult, ModConfig};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use zip::write::FileOptions;

// ==================== JSON GENERATION ====================

fn build_manifest(config: &ModConfig) -> serde_json::Value {
    serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": {
            "UniqueID": "Pathoschild.ContentPatcher"
        }
    })
}

fn build_content(audios: &[AudioEntry]) -> serde_json::Value {
    let mut changes = Vec::new();

    if !audios.is_empty() {
        let mut entries = serde_json::Map::new();
        for audio in audios {
            let paths: Vec<String> = audio
                .files
                .iter()
                .map(|f| format!("{{{{AbsoluteFilePath: assets/{}}}}}", f))
                .collect();

            let mut entry = serde_json::json!({
                "Id": audio.id,
                "Category": audio.category,
                "FilePaths": paths,
                "StreamedVorbis": true
            });
            if audio.category == "Music" && audio.looped {
                entry["Looped"] = serde_json::json!(true);
            }
            entries.insert(audio.id.clone(), entry);
        }
        changes.push(serde_json::json!({
            "Action": "EditData",
            "Target": "Data/AudioChanges",
            "Entries": entries
        }));
    }

    let jukebox: Vec<&AudioEntry> = audios.iter().filter(|a| a.jukebox.is_some()).collect();
    if !jukebox.is_empty() {
        let mut entries = serde_json::Map::new();
        for audio in jukebox {
            if let Some(jb) = &audio.jukebox {
                entries.insert(
                    audio.id.clone(),
                    serde_json::json!({
                        "Id": audio.id,
                        "Name": format!("{{{{i18n:Music.{}}}}}", audio.id),
                        "Available": jb.available
                    }),
                );
            }
        }
        changes.push(serde_json::json!({
            "Action": "EditData",
            "Target": "Data/JukeboxTracks",
            "Entries": entries
        }));
    }

    serde_json::json!({
        "Format": "2.0.0",
        "Changes": changes
    })
}

fn build_i18n(audios: &[AudioEntry]) -> serde_json::Value {
    let mut map = serde_json::Map::new();
    for audio in audios.iter().filter(|a| a.jukebox.is_some()) {
        if let Some(jb) = &audio.jukebox {
            map.insert(
                format!("Music.{}", audio.id),
                serde_json::Value::String(jb.name.clone()),
            );
        }
    }
    serde_json::Value::Object(map)
}

fn required_files(audios: &[AudioEntry]) -> Vec<String> {
    let mut files = Vec::new();
    for audio in audios {
        for file in &audio.files {
            if !files.contains(file) {
                files.push(file.clone());
            }
        }
    }
    files
}

// ==================== COMMANDS ====================

#[tauri::command]
pub fn generate_manifest_json(config: ModConfig) -> String {
    serde_json::to_string_pretty(&build_manifest(&config)).unwrap_or_default()
}

#[tauri::command]
pub fn generate_content_json(audios: Vec<AudioEntry>) -> String {
    serde_json::to_string_pretty(&build_content(&audios)).unwrap_or_default()
}

#[tauri::command]
pub fn generate_i18n_json(audios: Vec<AudioEntry>) -> String {
    serde_json::to_string_pretty(&build_i18n(&audios)).unwrap_or_default()
}

/// Export mod files to a chosen folder (native file system access)
#[tauri::command]
pub fn export_to_folder(
    folder_path: String,
    config: ModConfig,
    audios: Vec<AudioEntry>,
    copy_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<ExportResult, String> {
    let clean_name: String = config
        .name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect();
    let mod_folder = format!("[CP] {}", clean_name);
    let mod_path = PathBuf::from(&folder_path).join(&mod_folder);

    let mut created = Vec::new();

    // Create directories
    fs::create_dir_all(&mod_path).map_err(|e| e.to_string())?;
    fs::create_dir_all(mod_path.join("assets")).map_err(|e| e.to_string())?;
    fs::create_dir_all(mod_path.join("i18n")).map_err(|e| e.to_string())?;

    // Write manifest.json
    let manifest =
        serde_json::to_string_pretty(&build_manifest(&config)).map_err(|e| e.to_string())?;
    fs::write(mod_path.join("manifest.json"), &manifest).map_err(|e| e.to_string())?;
    created.push("manifest.json".to_string());

    // Write content.json
    let content =
        serde_json::to_string_pretty(&build_content(&audios)).map_err(|e| e.to_string())?;
    fs::write(mod_path.join("content.json"), &content).map_err(|e| e.to_string())?;
    created.push("content.json".to_string());

    // Write i18n/default.json
    let i18n =
        serde_json::to_string_pretty(&build_i18n(&audios)).map_err(|e| e.to_string())?;
    fs::write(mod_path.join("i18n/default.json"), &i18n).map_err(|e| e.to_string())?;
    created.push("i18n/default.json".to_string());

    // Copy actual audio files if requested
    if copy_audio_files {
        if let Some(source) = audio_source_folder {
            let source_path = PathBuf::from(&source);
            let req = required_files(&audios);
            for file in &req {
                let src = source_path.join(file);
                let dst = mod_path.join("assets").join(file);
                if src.exists() {
                    fs::copy(&src, &dst)
                        .map_err(|e| format!("Failed to copy {}: {}", file, e))?;
                    created.push(format!("assets/{}", file));
                }
            }
        }
    }

    // Write README in assets
    let req = required_files(&audios);
    let readme = format!(
        "ASSETS FOLDER\n\
         ==================\n\n\
         Place your .ogg audio files here.\n\n\
         Required files:\n{}\n\n\
         IMPORTANT:\n\
         - Use OGG Vorbis format (NOT Opus!)\n\
         - Sample rate: 44100Hz or 48000Hz\n\
         - Use Audacity to convert if needed\n\n\
         Total files needed: {}\n",
        req.iter()
            .map(|f| format!("  - {}", f))
            .collect::<Vec<_>>()
            .join("\n"),
        req.len()
    );
    fs::write(mod_path.join("assets/README.txt"), &readme).map_err(|e| e.to_string())?;
    created.push("assets/README.txt".to_string());

    Ok(ExportResult {
        success: true,
        path: mod_path.to_string_lossy().to_string(),
        message: format!("Mod exported to: {}", mod_path.display()),
        files_created: created,
    })
}

/// Export mod as ZIP file (native Rust compression)
#[tauri::command]
pub fn export_to_zip(
    file_path: String,
    config: ModConfig,
    audios: Vec<AudioEntry>,
    include_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<ExportResult, String> {
    let file = File::create(&file_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);

    // zip 0.6 API: FileOptions::default()
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let clean_name: String = config
        .name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect();
    let folder = format!("[CP] {}", clean_name);
    let mut created = Vec::new();

    // manifest.json
    let manifest =
        serde_json::to_string_pretty(&build_manifest(&config)).map_err(|e| e.to_string())?;
    zip.start_file(format!("{}/manifest.json", folder), options)
        .map_err(|e| e.to_string())?;
    zip.write_all(manifest.as_bytes())
        .map_err(|e| e.to_string())?;
    created.push("manifest.json".to_string());

    // content.json
    let content =
        serde_json::to_string_pretty(&build_content(&audios)).map_err(|e| e.to_string())?;
    zip.start_file(format!("{}/content.json", folder), options)
        .map_err(|e| e.to_string())?;
    zip.write_all(content.as_bytes())
        .map_err(|e| e.to_string())?;
    created.push("content.json".to_string());

    // i18n/default.json
    let i18n =
        serde_json::to_string_pretty(&build_i18n(&audios)).map_err(|e| e.to_string())?;
    zip.start_file(format!("{}/i18n/default.json", folder), options)
        .map_err(|e| e.to_string())?;
    zip.write_all(i18n.as_bytes())
        .map_err(|e| e.to_string())?;
    created.push("i18n/default.json".to_string());

    // Copy audio files into ZIP if requested
    if include_audio_files {
        if let Some(source) = audio_source_folder {
            let source_path = PathBuf::from(&source);
            let req = required_files(&audios);
            for file_name in &req {
                let src = source_path.join(file_name);
                if src.exists() {
                    let data = fs::read(&src)
                        .map_err(|e| format!("Failed to read {}: {}", file_name, e))?;
                    zip.start_file(
                        format!("{}/assets/{}", folder, file_name),
                        options,
                    )
                    .map_err(|e| e.to_string())?;
                    zip.write_all(&data).map_err(|e| e.to_string())?;
                    created.push(format!("assets/{}", file_name));
                }
            }
        }
    }

    // README
    let req = required_files(&audios);
    let readme = format!(
        "Required audio files:\n{}\n",
        req.iter()
            .map(|f| format!("  - {}", f))
            .collect::<Vec<_>>()
            .join("\n")
    );
    zip.start_file(format!("{}/assets/README.txt", folder), options)
        .map_err(|e| e.to_string())?;
    zip.write_all(readme.as_bytes())
        .map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| e.to_string())?;

    Ok(ExportResult {
        success: true,
        path: file_path.clone(),
        message: format!("ZIP created: {}", file_path),
        files_created: created,
    })
}
