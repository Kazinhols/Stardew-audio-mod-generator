// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod export;
mod project;
mod watcher;

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// ==================== APP STATE ====================

#[derive(Debug, Default)]
pub struct AppState {
    pub last_export_path: Mutex<Option<String>>,
    pub last_scan_path: Mutex<Option<String>>,
}

// ==================== TYPES ====================

#[derive(Debug, Serialize, Deserialize, Clone)]
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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub folder: String,
    pub files: Vec<AudioFileInfo>,
    pub total_valid: usize,
    pub total_invalid: usize,
    pub total_size: String,
}

// ==================== MAIN ====================

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // App info
            get_app_info,
            // Audio file operations
            audio::scan_audio_folder,
            audio::validate_ogg_file,
            audio::get_audio_info,
            // Project operations
            project::save_project,
            project::load_project,
            project::get_recent_projects,
            project::auto_save_project,
            project::load_auto_save,
            // Export operations
            export::export_to_folder,
            export::export_to_zip,
            export::generate_manifest_json,
            export::generate_content_json,
            export::generate_i18n_json,
            // File watcher
            watcher::watch_assets_folder,
            watcher::stop_watching,
        ])
        .setup(|app| {
            use tauri::Manager;
            // Create app data directories
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();
            std::fs::create_dir_all(app_dir.join("projects")).ok();
            std::fs::create_dir_all(app_dir.join("autosave")).ok();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Stardew Audio Mod Generator",
        "version": "3.0.0",
        "author": "Kazinhols",
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "is_desktop": true
    })
}
