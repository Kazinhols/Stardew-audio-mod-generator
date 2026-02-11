use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use zip::write::FileOptions;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModConfig {
    pub id: String,
    pub name: String,
    pub author: String,
    pub version: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JukeboxInfo {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioEntry {
    pub id: String,
    pub category: String,
    pub files: Vec<String>,
    pub looped: bool,
    pub jukebox: Option<JukeboxInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioFileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub size_display: String,
    pub is_vorbis: bool,
    pub sample_rate: Option<u32>,
    pub channels: Option<u16>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub files: Vec<AudioFileInfo>,
    pub total_size: String,
    pub total_valid: usize,
    pub total_invalid: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub message: String,
    pub files_created: Vec<String>,
}

#[tauri::command]
pub fn scan_audio_folder(folder_path: String) -> ScanResult {
    let mut files = Vec::new();
    let mut total_bytes = 0;
    let mut total_valid = 0;
    let mut total_invalid = 0;

    for entry in WalkDir::new(&folder_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if ["ogg", "wav", "mp3", "flac"].contains(&ext_str.as_str()) {
                    let metadata = fs::metadata(path).ok();
                    let size = metadata.map(|m| m.len()).unwrap_or(0);
                    total_bytes += size;

                    let is_vorbis = ext_str == "ogg"; 
                    let is_wav = ext_str == "wav";
                    
                    if is_vorbis || is_wav {
                        total_valid += 1;
                    } else {
                        total_invalid += 1;
                    }

                    files.push(AudioFileInfo {
                        name: entry.file_name().to_string_lossy().to_string(),
                        path: path.to_string_lossy().to_string(),
                        size,
                        size_display: format!("{:.2} MB", size as f64 / 1024.0 / 1024.0),
                        is_vorbis,
                        sample_rate: None,
                        channels: None,
                        error: None,
                    });
                }
            }
        }
    }

    ScanResult {
        files,
        total_size: format!("{:.2} MB", total_bytes as f64 / 1024.0 / 1024.0),
        total_valid,
        total_invalid,
    }
}

#[tauri::command]
pub fn export_to_folder(
    folder_path: String,
    config: ModConfig,
    audios: Vec<AudioEntry>,
    copy_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<ExportResult, String> {
    let base_path = Path::new(&folder_path);
    if !base_path.exists() {
        fs::create_dir_all(base_path).map_err(|e| e.to_string())?;
    }

    let mut created_files = Vec::new();

    let manifest = serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": { "UniqueID": "Pathoschild.ContentPatcher" }
    });
    let manifest_path = base_path.join("manifest.json");
    fs::write(&manifest_path, serde_json::to_string_pretty(&manifest).unwrap()).map_err(|e| e.to_string())?;
    created_files.push(manifest_path.to_string_lossy().to_string());

    let mut changes = Vec::new();
    for audio in &audios {
        if audio.files.is_empty() { continue; }
        let file_paths = if audio.files.len() == 1 { serde_json::json!(audio.files[0]) } else { serde_json::json!(audio.files) };
        
        let mut entry_data = serde_json::Map::new();
        entry_data.insert("Category".to_string(), serde_json::json!(audio.category));
        entry_data.insert("FilePaths".to_string(), file_paths);
        entry_data.insert("Looped".to_string(), serde_json::json!(audio.looped));
        
        if let Some(_) = &audio.jukebox {
             entry_data.insert("Jukebox".to_string(), serde_json::json!(true));
        }

        let mut entries = serde_json::Map::new();
        entries.insert(audio.id.clone(), serde_json::Value::Object(entry_data));

        changes.push(serde_json::json!({
            "Action": "EditData",
            "Target": "Data/AudioCues",
            "Entries": entries
        }));
    }

    let content_json = serde_json::json!({ "Format": "2.0.0", "Changes": changes });
    let content_path = base_path.join("content.json");
    fs::write(&content_path, serde_json::to_string_pretty(&content_json).unwrap()).map_err(|e| e.to_string())?;
    created_files.push(content_path.to_string_lossy().to_string());

    let i18n_dir = base_path.join("i18n");
    if !i18n_dir.exists() { fs::create_dir(&i18n_dir).map_err(|e| e.to_string())?; }

    let mut i18n_map = serde_json::Map::new();
    for audio in &audios {
        if let Some(jukebox) = &audio.jukebox {
            if !jukebox.name.is_empty() {
                i18n_map.insert(format!("AudioCue.{}.Name", audio.id), serde_json::Value::String(jukebox.name.clone()));
            }
        }
    }

    let default_json_path = i18n_dir.join("default.json");
    fs::write(&default_json_path, serde_json::to_string_pretty(&i18n_map).unwrap()).map_err(|e| e.to_string())?;
    created_files.push(default_json_path.to_string_lossy().to_string());

    let assets_dir = base_path.join("assets");
    if !assets_dir.exists() { fs::create_dir(&assets_dir).map_err(|e| e.to_string())?; }

    if copy_audio_files {
        if let Some(source) = audio_source_folder {
             let source_path = Path::new(&source);
             let mut unique_files = HashSet::new();
             for audio in &audios {
                for file in &audio.files {
                    unique_files.insert(file);
                }
             }
             for file in unique_files {
                let src = source_path.join(file);
                let dest = assets_dir.join(file);
                if src.exists() {
                    fs::copy(src, dest).ok();
                }
             }
        }
    }

    Ok(ExportResult { success: true, message: "Success".into(), files_created: created_files })
}

#[tauri::command]
pub fn export_to_zip(
    file_path: String,
    config: ModConfig,
    audios: Vec<AudioEntry>,
    include_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<ExportResult, String> {
    let path = Path::new(&file_path);
    let file = File::create(&path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    let clean_name = config.name.replace(|c: char| !c.is_alphanumeric() && c != ' ', "");
    let root_dir = format!("[CP] {}", clean_name.trim());

    let manifest = serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": { "UniqueID": "Pathoschild.ContentPatcher" }
    });
    zip.start_file(format!("{}/manifest.json", root_dir), options).map_err(|e| e.to_string())?;
    zip.write_all(serde_json::to_string_pretty(&manifest).unwrap().as_bytes()).map_err(|e| e.to_string())?;

    let mut changes = Vec::new();
    for audio in &audios {
        if audio.files.is_empty() { continue; }
        let file_paths = if audio.files.len() == 1 { serde_json::json!(audio.files[0]) } else { serde_json::json!(audio.files) };
        let mut entry_data = serde_json::Map::new();
        entry_data.insert("Category".to_string(), serde_json::json!(audio.category));
        entry_data.insert("FilePaths".to_string(), file_paths);
        entry_data.insert("Looped".to_string(), serde_json::json!(audio.looped));
        if let Some(_) = &audio.jukebox {
             entry_data.insert("Jukebox".to_string(), serde_json::json!(true));
        }
        let mut entries = serde_json::Map::new();
        entries.insert(audio.id.clone(), serde_json::Value::Object(entry_data));
        changes.push(serde_json::json!({ "Action": "EditData", "Target": "Data/AudioCues", "Entries": entries }));
    }

    let content_json = serde_json::json!({ "Format": "2.0.0", "Changes": changes });
    zip.start_file(format!("{}/content.json", root_dir), options).map_err(|e| e.to_string())?;
    zip.write_all(serde_json::to_string_pretty(&content_json).unwrap().as_bytes()).map_err(|e| e.to_string())?;

    let mut i18n_map = serde_json::Map::new();
    for audio in &audios {
        if let Some(jukebox) = &audio.jukebox {
            if !jukebox.name.is_empty() {
                i18n_map.insert(format!("AudioCue.{}.Name", audio.id), serde_json::Value::String(jukebox.name.clone()));
            }
        }
    }

    zip.add_directory(format!("{}/i18n/", root_dir), options).map_err(|e| e.to_string())?;
    zip.start_file(format!("{}/i18n/default.json", root_dir), options).map_err(|e| e.to_string())?;
    zip.write_all(serde_json::to_string_pretty(&i18n_map).unwrap().as_bytes()).map_err(|e| e.to_string())?;

    if include_audio_files {
        if let Some(source_folder) = audio_source_folder {
            let source_path = Path::new(&source_folder);
            let mut unique_files = HashSet::new();
            for audio in &audios {
                for file in &audio.files {
                    unique_files.insert(file);
                }
            }
            for file_name in unique_files {
                let src_file_path = source_path.join(file_name);
                if src_file_path.exists() {
                    if let Ok(mut f) = File::open(&src_file_path) {
                        let mut buffer = Vec::new();
                        if f.read_to_end(&mut buffer).is_ok() {
                            zip.start_file(format!("{}/assets/{}", root_dir, file_name), options).map_err(|e| e.to_string())?;
                            zip.write_all(&buffer).map_err(|e| e.to_string())?;
                        }
                    }
                }
            }
        }
    } else {
        zip.add_directory(format!("{}/assets/", root_dir), options).map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(ExportResult { success: true, message: "ZIP created".into(), files_created: vec![file_path] })
}

#[tauri::command]
pub fn save_project(path: String, data: serde_json::Value) -> Result<(), String> {
    fs::write(path, serde_json::to_string_pretty(&data).unwrap()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_project(path: String) -> Result<serde_json::Value, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn auto_save_project(data: serde_json::Value) -> Result<(), String> {
    let path = std::env::temp_dir().join("sdv_audio_autosave.json");
    fs::write(path, serde_json::to_string(&data).unwrap()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_auto_save() -> Result<serde_json::Value, String> {
    let path = std::env::temp_dir().join("sdv_audio_autosave.json");
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn generate_manifest_json(config: ModConfig) -> String {
    let manifest = serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": { "UniqueID": "Pathoschild.ContentPatcher" }
    });
    serde_json::to_string_pretty(&manifest).unwrap_or_default()
}

#[tauri::command]
pub fn generate_content_json(audios: Vec<AudioEntry>) -> String {
    let mut changes = Vec::new();
    for audio in audios {
        if audio.files.is_empty() { continue; }
        let file_paths = if audio.files.len() == 1 { serde_json::json!(audio.files[0]) } else { serde_json::json!(audio.files) };
        let mut entry_data = serde_json::Map::new();
        entry_data.insert("Category".to_string(), serde_json::json!(audio.category));
        entry_data.insert("FilePaths".to_string(), file_paths);
        entry_data.insert("Looped".to_string(), serde_json::json!(audio.looped));
        if let Some(_) = audio.jukebox {
             entry_data.insert("Jukebox".to_string(), serde_json::json!(true));
        }
        let mut entries = serde_json::Map::new();
        entries.insert(audio.id, serde_json::Value::Object(entry_data));
        changes.push(serde_json::json!({ "Action": "EditData", "Target": "Data/AudioCues", "Entries": entries }));
    }
    serde_json::to_string_pretty(&serde_json::json!({ "Format": "2.0.0", "Changes": changes })).unwrap_or_default()
}

#[tauri::command]
pub fn generate_i18n_json(audios: Vec<AudioEntry>) -> String {
    let mut map = serde_json::Map::new();
    for audio in audios {
        if let Some(j) = audio.jukebox {
            if !j.name.is_empty() {
                map.insert(format!("AudioCue.{}.Name", audio.id), serde_json::Value::String(j.name));
            }
        }
    }
    serde_json::to_string_pretty(&map).unwrap_or_default()
}

#[tauri::command]
pub fn watch_assets_folder(_folder_path: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn convert_audio(source_path: String, target_format: String) -> Result<serde_json::Value, String> {
    let source = Path::new(&source_path);
    if !source.exists() { return Err("Source not found".into()); }
    
    let target = source.with_extension(&target_format);
    
    let status = std::process::Command::new("ffmpeg")
        .arg("-y")
        .arg("-i")
        .arg(source)
        .arg(&target)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(serde_json::json!({
            "success": true,
            "output_path": target.to_string_lossy()
        }))
    } else {
        Err("FFmpeg failed".into())
    }
}