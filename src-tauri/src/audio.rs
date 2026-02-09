use crate::{AudioFileInfo, ScanResult};
use std::fs;
use std::io::Read;
use std::path::Path;
use walkdir::WalkDir;

/// Scan a folder for .ogg files and validate each one
#[tauri::command]
pub fn scan_audio_folder(folder_path: String) -> Result<ScanResult, String> {
    let path = Path::new(&folder_path);
    if !path.exists() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_path));
    }

    let mut files = Vec::new();
    let mut total_size: u64 = 0;

    for entry in WalkDir::new(path)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let entry_path = entry.path();
        if entry_path.is_file() {
            if let Some(ext) = entry_path.extension() {
                if ext.to_string_lossy().to_lowercase() == "ogg" {
                    let info = analyze_ogg_file(entry_path);
                    total_size += info.size_bytes;
                    files.push(info);
                }
            }
        }
    }

    // Sort by name
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    let total_valid = files.iter().filter(|f| f.is_valid_ogg && f.is_vorbis).count();
    let total_invalid = files.len() - total_valid;

    Ok(ScanResult {
        folder: folder_path,
        files,
        total_valid,
        total_invalid,
        total_size: format_size(total_size),
    })
}

/// Validate a single OGG file
#[tauri::command]
pub fn validate_ogg_file(file_path: String) -> Result<AudioFileInfo, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    Ok(analyze_ogg_file(path))
}

/// Get audio file information
#[tauri::command]
pub fn get_audio_info(file_path: String) -> Result<AudioFileInfo, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    Ok(analyze_ogg_file(path))
}

/// Analyze an OGG file by reading raw bytes to detect Vorbis vs Opus
fn analyze_ogg_file(path: &Path) -> AudioFileInfo {
    let name = path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let file_path = path.to_string_lossy().to_string();

    // Get file size
    let metadata = fs::metadata(path);
    let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
    let size_display = format_size(size_bytes);

    // Try to read file header (first 512 bytes is enough)
    let mut header_buf = [0u8; 512];
    let bytes_read = match fs::File::open(path).and_then(|mut f| f.read(&mut header_buf)) {
        Ok(n) => n,
        Err(e) => {
            return AudioFileInfo {
                name,
                path: file_path,
                size_bytes,
                size_display,
                is_valid_ogg: false,
                is_vorbis: false,
                error: Some(format!("Cannot open file: {}", e)),
                duration_secs: None,
                sample_rate: None,
                channels: None,
            };
        }
    };

    let data = &header_buf[..bytes_read];

    // Check OGG magic: "OggS"
    if bytes_read < 4 || &data[0..4] != b"OggS" {
        return AudioFileInfo {
            name,
            path: file_path,
            size_bytes,
            size_display,
            is_valid_ogg: false,
            is_vorbis: false,
            error: Some("Not a valid OGG file (missing OggS header)".to_string()),
            duration_secs: None,
            sample_rate: None,
            channels: None,
        };
    }

    // OGG page header is at least 27 bytes, then segment table
    // The actual codec data starts after the OGG page header
    // Page header: 27 bytes + number_of_segments bytes (segment table)
    if bytes_read < 28 {
        return AudioFileInfo {
            name,
            path: file_path,
            size_bytes,
            size_display,
            is_valid_ogg: true,
            is_vorbis: false,
            error: Some("OGG file too small to analyze".to_string()),
            duration_secs: None,
            sample_rate: None,
            channels: None,
        };
    }

    let num_segments = data[26] as usize;
    let segment_table_end = 27 + num_segments;

    if bytes_read <= segment_table_end {
        return AudioFileInfo {
            name,
            path: file_path,
            size_bytes,
            size_display,
            is_valid_ogg: true,
            is_vorbis: false,
            error: Some("OGG file too small to identify codec".to_string()),
            duration_secs: None,
            sample_rate: None,
            channels: None,
        };
    }

    // The codec identification packet starts at segment_table_end
    let codec_data = &data[segment_table_end..];

    let mut is_vorbis = false;
    let mut is_opus = false;
    let mut sample_rate: Option<u32> = None;
    let mut channels: Option<u8> = None;
    let mut error: Option<String> = None;

    // Check Vorbis identification header: 0x01 + "vorbis"
    if codec_data.len() >= 30 && codec_data[0] == 0x01 && &codec_data[1..7] == b"vorbis" {
        is_vorbis = true;
        // Parse Vorbis header
        channels = Some(codec_data[11]);
        sample_rate = Some(u32::from_le_bytes([
            codec_data[12],
            codec_data[13],
            codec_data[14],
            codec_data[15],
        ]));
    }
    // Check Opus header: "OpusHead"
    else if codec_data.len() >= 8 && &codec_data[0..8] == b"OpusHead" {
        is_opus = true;
        error = Some("⚠️ This is OGG Opus, NOT Vorbis! Stardew Valley requires OGG Vorbis. Convert with Audacity.".to_string());
        if codec_data.len() >= 12 {
            channels = Some(codec_data[9]);
            sample_rate = Some(48000); // Opus is always 48kHz internally
        }
    }
    // Unknown codec
    else {
        error = Some("Unknown OGG codec. Expected Vorbis.".to_string());
    }

    // Estimate duration from file size (rough estimate for Vorbis ~128kbps)
    let duration_secs = if size_bytes > 0 && is_vorbis {
        Some((size_bytes as f64 * 8.0) / 128000.0)
    } else {
        None
    };

    AudioFileInfo {
        name,
        path: file_path,
        size_bytes,
        size_display,
        is_valid_ogg: !is_opus && (is_vorbis || error.is_none()),
        is_vorbis,
        error,
        duration_secs,
        sample_rate,
        channels,
    }
}

fn format_size(bytes: u64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else if bytes < 1024 * 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.2} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    }
}
