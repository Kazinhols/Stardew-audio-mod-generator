mod commands;
use commands::*;

#[tauri::command]
fn open_in_explorer(path: String) -> Result<(), String> {
    let target = std::path::Path::new(&path);
    let folder = if target.is_file() {
        target.parent().unwrap_or(target).to_path_buf()
    } else {
        target.to_path_buf()
    };

    if !folder.exists() {
        return Err(format!("Path does not exist: {}", folder.display()));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&folder)
            .spawn()
            .map_err(|e| format!("Failed: {e}"))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&folder)
            .spawn()
            .map_err(|e| format!("Failed: {e}"))?;
        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        let managers = ["xdg-open", "nautilus", "dolphin", "thunar", "pcmanfm"];
        for mgr in &managers {
            if std::process::Command::new(mgr).arg(&folder).spawn().is_ok() {
                return Ok(());
            }
        }
        return Err("No file manager found".to_string());
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            scan_audio_folder,
            watch_assets_folder,
            save_project,
            load_project,
            auto_save_project,
            load_auto_save,
            generate_manifest_json,
            generate_content_json,
            generate_i18n_json,
            export_to_folder,
            export_to_zip,
            convert_audio,
            open_in_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}