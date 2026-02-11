use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter, Manager};


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioFileInfo {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub size_display: String,
    pub is_valid_ogg: bool,
    pub is_vorbis: bool,
    pub error: Option<String>,
    pub duration_secs: Option<f64>,
    pub sample_rate: Option<u32>,
    pub channels: Option<u8>,
    pub format: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub folder: String,
    pub files: Vec<AudioFileInfo>,
    pub total_valid: usize,
    pub total_invalid: usize,
    pub total_size: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModConfig {
    pub id: String,
    pub name: String,
    pub author: String,
    pub version: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JukeboxConfig {
    pub name: String,
    pub available: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioEntry {
    pub id: String,
    pub category: String,
    pub files: Vec<String>,
    pub looped: bool,
    pub jukebox: Option<JukeboxConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub config: ModConfig,
    pub audios: Vec<AudioEntry>,
    pub version: String,
    pub saved_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub path: String,
    pub message: String,
    pub files_created: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConvertResult {
    pub success: bool,
    pub output_path: String,
    pub message: String,
}


fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

fn get_audio_format(path: &Path) -> String {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_uppercase())
        .unwrap_or_else(|| "UNKNOWN".to_string())
}

fn is_audio_file(path: &Path) -> bool {
    let audio_extensions = [
        "ogg", "mp3", "wav", "flac", "m4a", "aac", "wma", "opus", "aiff", "ape", "wv",
    ];
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| audio_extensions.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn analyze_ogg_file(path: &Path) -> AudioFileInfo {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    let path_str = path.to_string_lossy().to_string();
    let format = get_audio_format(path);

    let metadata = match fs::metadata(path) {
        Ok(m) => m,
        Err(e) => {
            return AudioFileInfo {
                name,
                path: path_str,
                size_bytes: 0,
                size_display: "0 B".to_string(),
                is_valid_ogg: false,
                is_vorbis: false,
                error: Some(format!("Erro ao ler arquivo: {}", e)),
                duration_secs: None,
                sample_rate: None,
                channels: None,
                format,
            };
        }
    };

    let size_bytes = metadata.len();
    let size_display = format_size(size_bytes);

    if format != "OGG" {
        let is_valid = format == "WAV";
        return AudioFileInfo {
            name,
            path: path_str,
            size_bytes,
            size_display,
            is_valid_ogg: is_valid,
            is_vorbis: false,
            error: if is_valid { None } else { Some(format!("Formato {} - converter para OGG Vorbis", format)) },
            duration_secs: None,
            sample_rate: None,
            channels: None,
            format,
        };
    }

    let file = match fs::File::open(path) {
        Ok(f) => f,
        Err(e) => {
            return AudioFileInfo {
                name,
                path: path_str,
                size_bytes,
                size_display,
                is_valid_ogg: false,
                is_vorbis: false,
                error: Some(format!("Erro ao abrir: {}", e)),
                duration_secs: None,
                sample_rate: None,
                channels: None,
                format,
            };
        }
    };

    let mut reader = ogg::PacketReader::new(file);

    match reader.read_packet() {
        Ok(Some(packet)) => {
            let is_vorbis = packet.data.len() >= 7
                && packet.data[0] == 0x01
                && &packet.data[1..7] == b"vorbis";

            if is_vorbis && packet.data.len() >= 30 {
                let channels = packet.data[11];
                let sample_rate = u32::from_le_bytes([
                    packet.data[12],
                    packet.data[13],
                    packet.data[14],
                    packet.data[15],
                ]);

                let bitrate_nominal = i32::from_le_bytes([
                    packet.data[20],
                    packet.data[21],
                    packet.data[22],
                    packet.data[23],
                ]);
                let duration = if bitrate_nominal > 0 {
                    Some((size_bytes as f64 * 8.0) / bitrate_nominal as f64)
                } else {
                    None
                };

                AudioFileInfo {
                    name,
                    path: path_str,
                    size_bytes,
                    size_display,
                    is_valid_ogg: true,
                    is_vorbis: true,
                    error: None,
                    duration_secs: duration,
                    sample_rate: Some(sample_rate),
                    channels: Some(channels),
                    format,
                }
            } else {
                AudioFileInfo {
                    name,
                    path: path_str,
                    size_bytes,
                    size_display,
                    is_valid_ogg: true,
                    is_vorbis: false,
                    error: Some("OGG Opus - Stardew Valley requer OGG Vorbis!".to_string()),
                    duration_secs: None,
                    sample_rate: None,
                    channels: None,
                    format,
                }
            }
        }
        Ok(None) => {
            AudioFileInfo {
                name,
                path: path_str,
                size_bytes,
                size_display,
                is_valid_ogg: false,
                is_vorbis: false,
                error: Some("Arquivo OGG vazio".to_string()),
                duration_secs: None,
                sample_rate: None,
                channels: None,
                format,
            }
        }
        Err(e) => {
            AudioFileInfo {
                name,
                path: path_str,
                size_bytes,
                size_display,
                is_valid_ogg: false,
                is_vorbis: false,
                error: Some(format!("Erro ao analisar OGG: {}", e)),
                duration_secs: None,
                sample_rate: None,
                channels: None,
                format,
            }
        }
    }
}

#[tauri::command]
pub async fn scan_audio_folder(folder_path: String) -> Result<ScanResult, String> {
    log::info!("🔍 Scanning folder: {}", folder_path);

    let path = Path::new(&folder_path);
    if !path.exists() {
        return Err("Pasta não encontrada".to_string());
    }

    let mut files = Vec::new();
    let mut total_size: u64 = 0;

    for entry in walkdir::WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let entry_path = entry.path();
        if entry_path.is_file() && is_audio_file(entry_path) {
            let info = analyze_ogg_file(entry_path);
            total_size += info.size_bytes;
            files.push(info);
        }
    }

    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    let total_valid = files.iter().filter(|f| f.is_vorbis).count();
    let total_invalid = files.len() - total_valid;

    log::info!(
        "✅ Scan complete: {} files ({} valid, {} invalid)",
        files.len(),
        total_valid,
        total_invalid
    );

    Ok(ScanResult {
        folder: folder_path,
        files,
        total_valid,
        total_invalid,
        total_size: format_size(total_size),
    })
}

#[tauri::command]
pub async fn watch_assets_folder(app_handle: AppHandle, folder_path: String) -> Result<(), String> {
    use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
    use std::sync::mpsc::channel;
    use std::time::Duration;

    log::info!("👁️ Starting file watcher for: {}", folder_path);

    let (tx, rx) = channel();
    let folder = folder_path.clone();

    std::thread::spawn(move || {
        let mut watcher: RecommendedWatcher =
            Watcher::new(tx, Config::default().with_poll_interval(Duration::from_secs(2)))
                .expect("Failed to create watcher");

        watcher
            .watch(Path::new(&folder), RecursiveMode::Recursive)
            .expect("Failed to watch folder");

        loop {
            match rx.recv() {
                Ok(Ok(event)) => {
                    let files: Vec<String> = event
                        .paths
                        .iter()
                        .filter_map(|p| p.file_name())
                        .filter_map(|n| n.to_str())
                        .map(|s| s.to_string())
                        .collect();

                    if !files.is_empty() {
                        log::info!("📁 Files changed: {:?}", files);
                        let _ = app_handle.emit(
                            "assets-changed",
                            serde_json::json!({
                                "folder": folder,
                                "files": files,
                                "kind": format!("{:?}", event.kind),
                            }),
                        );
                    }
                }
                Ok(Err(e)) => log::error!("Watch error: {:?}", e),
                Err(e) => {
                    log::error!("Channel error: {:?}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn save_project(path: String, data: ProjectData) -> Result<(), String> {
    log::info!("💾 Saving project to: {}", path);

    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| format!("Erro ao salvar: {}", e))?;

    log::info!("✅ Project saved successfully");
    Ok(())
}

#[tauri::command]
pub async fn load_project(path: String) -> Result<ProjectData, String> {
    log::info!("📂 Loading project from: {}", path);

    let content = fs::read_to_string(&path).map_err(|e| format!("Erro ao ler: {}", e))?;
    let data: ProjectData =
        serde_json::from_str(&content).map_err(|e| format!("JSON inválido: {}", e))?;

    log::info!("✅ Project loaded: {} audios", data.audios.len());
    Ok(data)
}

#[tauri::command]
pub async fn auto_save_project(app_handle: AppHandle, data: ProjectData) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let path = app_dir.join("autosave.sdvaudio.json");
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;

    log::debug!("💾 Auto-saved to {:?}", path);
    Ok(())
}

#[tauri::command]
pub async fn load_auto_save(app_handle: AppHandle) -> Result<Option<ProjectData>, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let path = app_dir.join("autosave.sdvaudio.json");

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let data: ProjectData = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    log::info!("💾 Auto-save restored: {} audios", data.audios.len());
    Ok(Some(data))
}

#[tauri::command]
pub fn generate_manifest_json(config: ModConfig) -> Result<String, String> {
    let manifest = serde_json::json!({
        "Name": config.name,
        "Author": config.author,
        "Version": config.version,
        "Description": config.description,
        "UniqueID": config.id,
        "UpdateKeys": [],
        "ContentPackFor": {
            "UniqueID": "Pathoschild.ContentPatcher"
        }
    });

    serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn generate_content_json(audios: Vec<AudioEntry>) -> Result<String, String> {
    let mut changes = Vec::new();

    if !audios.is_empty() {
        let mut entries = serde_json::Map::new();

        for audio in &audios {
            let file_paths: Vec<String> = audio
                .files
                .iter()
                .map(|f| format!("{{{{AbsoluteFilePath: assets/{}}}}}", f))
                .collect();

            let mut entry = serde_json::json!({
                "Id": audio.id,
                "Category": audio.category,
                "FilePaths": file_paths,
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

    let jukebox_audios: Vec<_> = audios.iter().filter(|a| a.jukebox.is_some()).collect();
    if !jukebox_audios.is_empty() {
        let mut entries = serde_json::Map::new();

        for audio in jukebox_audios {
            if let Some(jukebox) = &audio.jukebox {
                entries.insert(
                    audio.id.clone(),
                    serde_json::json!({
                        "Id": audio.id,
                        "Name": format!("{{{{i18n:Music.{}}}}}", audio.id),
                        "Available": jukebox.available
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

    let content = serde_json::json!({
        "Format": "2.0.0",
        "Changes": changes
    });

    serde_json::to_string_pretty(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn generate_i18n_json(audios: Vec<AudioEntry>) -> Result<String, String> {
    let mut i18n = serde_json::Map::new();

    for audio in audios {
        if let Some(jukebox) = audio.jukebox {
            i18n.insert(format!("Music.{}", audio.id), serde_json::json!(jukebox.name));
        }
    }

    serde_json::to_string_pretty(&serde_json::Value::Object(i18n)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_to_folder(
    folder_path: String,
    config: ModConfig,
    audios: Vec<AudioEntry>,
    copy_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<ExportResult, String> {
    log::info!("📂 Exporting to folder: {}", folder_path);

    let clean_name = config
        .name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect::<String>();
    let mod_folder = Path::new(&folder_path).join(format!("[CP] {}", clean_name.trim()));

    fs::create_dir_all(&mod_folder).map_err(|e| e.to_string())?;
    fs::create_dir_all(mod_folder.join("assets")).map_err(|e| e.to_string())?;
    fs::create_dir_all(mod_folder.join("i18n")).map_err(|e| e.to_string())?;

    let mut files_created = Vec::new();

    let manifest = generate_manifest_json(config)?;
    let manifest_path = mod_folder.join("manifest.json");
    fs::write(&manifest_path, &manifest).map_err(|e| e.to_string())?;
    files_created.push("manifest.json".to_string());

    let content = generate_content_json(audios.clone())?;
    let content_path = mod_folder.join("content.json");
    fs::write(&content_path, &content).map_err(|e| e.to_string())?;
    files_created.push("content.json".to_string());

    let i18n = generate_i18n_json(audios.clone())?;
    let i18n_path = mod_folder.join("i18n/default.json");
    fs::write(&i18n_path, &i18n).map_err(|e| e.to_string())?;
    files_created.push("i18n/default.json".to_string());

    if copy_audio_files {
        if let Some(source) = audio_source_folder {
            let source_path = Path::new(&source);
            for audio in &audios {
                for file in &audio.files {
                    let src = source_path.join(file);
                    let dst = mod_folder.join("assets").join(file);

                    if src.exists() {
                        if let Some(parent) = dst.parent() {
                            fs::create_dir_all(parent).ok();
                        }
                        if fs::copy(&src, &dst).is_ok() {
                            files_created.push(format!("assets/{}", file));
                        }
                    }
                }
            }
        }
    }

    log::info!("✅ Export complete: {} files created", files_created.len());

    Ok(ExportResult {
        success: true,
        path: mod_folder.to_string_lossy().to_string(),
        message: format!("{} arquivos criados", files_created.len()),
        files_created,
    })
}

#[tauri::command]
pub async fn export_to_zip(
    file_path: String,
    config: ModConfig,
    audios: Vec<AudioEntry>,
    include_audio_files: bool,
    audio_source_folder: Option<String>,
) -> Result<ExportResult, String> {
    use zip::write::SimpleFileOptions;
    use zip::ZipWriter;

    log::info!("📦 Creating ZIP: {}", file_path);

    let file = fs::File::create(&file_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);

    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let clean_name = config
        .name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect::<String>();
    let prefix = format!("[CP] {}", clean_name.trim());

    let mut files_created = Vec::new();

    let manifest = generate_manifest_json(config)?;
    zip.start_file(format!("{}/manifest.json", prefix), options)
        .map_err(|e: zip::result::ZipError| e.to_string())?;
    zip.write_all(manifest.as_bytes())
        .map_err(|e: std::io::Error| e.to_string())?;
    files_created.push("manifest.json".to_string());

    let content = generate_content_json(audios.clone())?;
    zip.start_file(format!("{}/content.json", prefix), options)
        .map_err(|e: zip::result::ZipError| e.to_string())?;
    zip.write_all(content.as_bytes())
        .map_err(|e: std::io::Error| e.to_string())?;
    files_created.push("content.json".to_string());

    let i18n = generate_i18n_json(audios.clone())?;
    if !i18n.trim().is_empty() && i18n != "{}" {
        zip.start_file(format!("{}/i18n/default.json", prefix), options)
            .map_err(|e: zip::result::ZipError| e.to_string())?;
        zip.write_all(i18n.as_bytes())
            .map_err(|e: std::io::Error| e.to_string())?;
        files_created.push("i18n/default.json".to_string());
    }

    if include_audio_files {
        if let Some(source) = audio_source_folder {
            let source_path = Path::new(&source);
            for audio in &audios {
                for file in &audio.files {
                    let src = source_path.join(file);
                    if src.exists() {
                        if let Ok(data) = fs::read(&src) {
                            zip.start_file(format!("{}/assets/{}", prefix, file), options)
                                .map_err(|e: zip::result::ZipError| e.to_string())?;
                            zip.write_all(&data)
                                .map_err(|e: std::io::Error| e.to_string())?;
                            files_created.push(format!("assets/{}", file));
                        }
                    }
                }
            }
        }
    }

    zip.finish()
        .map_err(|e: zip::result::ZipError| e.to_string())?;

    log::info!("✅ ZIP created: {} files", files_created.len());

    Ok(ExportResult {
        success: true,
        path: file_path,
        message: format!("{} arquivos no ZIP", files_created.len()),
        files_created,
    })
}

#[tauri::command]
pub async fn convert_audio(
    source_path: String,
    target_format: String,
    output_dir: Option<String>,
) -> Result<ConvertResult, String> {
    log::info!(
        "🔄 Converting {} to {}",
        source_path,
        target_format.to_uppercase()
    );

    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("Arquivo fonte não encontrado".to_string());
    }

    let stem = source.file_stem().and_then(|s| s.to_str()).unwrap_or("audio");
    let extension = match target_format.to_lowercase().as_str() {
        "ogg" | "vorbis" => "ogg",
        "wav" => "wav",
        _ => return Err(format!("Formato não suportado: {}", target_format)),
    };

    let output_path = if let Some(dir) = output_dir {
        Path::new(&dir).join(format!("{}.{}", stem, extension))
    } else {
        source.with_extension(extension)
    };

    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y")
        .arg("-i")
        .arg(&source_path);

    match extension {
        "ogg" => {
            cmd.arg("-c:a")
                .arg("libvorbis")          
                .arg("-q:a")
                .arg("6")                  
                .arg("-ar")
                .arg("44100")              
                .arg("-ac")
                .arg("2");                 
        }
        "wav" => {
            cmd.arg("-c:a")
                .arg("pcm_s16le")          
                .arg("-ar")
                .arg("44100")              
                .arg("-ac")
                .arg("2");               
        }
        _ => {}
    }

    cmd.arg(&output_path);

    log::debug!("Running: {:?}", cmd);

    let output = cmd.output().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            "FFmpeg não encontrado! Instale com:\n\n\
            • CachyOS/Arch: sudo pacman -S ffmpeg\n\
            • Ubuntu/Debian: sudo apt install ffmpeg\n\
            • Fedora: sudo dnf install ffmpeg\n\
            • macOS: brew install ffmpeg\n\
            • Windows: winget install ffmpeg".to_string()
        } else {
            format!("Erro ao executar FFmpeg: {}", e)
        }
    })?;

    if output.status.success() {
        log::info!("✅ Conversion complete: {:?}", output_path);
        
        let verify_cmd = Command::new("ffprobe")
            .args(&[
                "-v", "error",
                "-select_streams", "a:0",
                "-show_entries", "stream=codec_name",
                "-of", "default=noprint_wrappers=1:nokey=1",
                output_path.to_str().unwrap()
            ])
            .output();
            
        if let Ok(verify_output) = verify_cmd {
            let codec = String::from_utf8_lossy(&verify_output.stdout).trim().to_string();
            log::info!("📊 Codec verificado: {}", codec);
            
            if extension == "ogg" && codec != "vorbis" {
                log::warn!("⚠️ AVISO: Arquivo OGG mas codec é '{}', não 'vorbis'!", codec);
                return Err(format!(
                    "Conversão falhou: arquivo gerado com codec '{}' ao invés de 'vorbis'.\n\
                    Verifique se FFmpeg foi compilado com suporte a libvorbis.",
                    codec
                ));
            }
        }
        
        Ok(ConvertResult {
            success: true,
            output_path: output_path.to_string_lossy().to_string(),
            message: format!("Convertido para {} com sucesso", extension.to_uppercase()),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        log::error!("❌ FFmpeg error: {}", stderr);
        Err(format!("Erro FFmpeg: {}", stderr))
    }
}
