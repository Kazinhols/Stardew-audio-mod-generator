use tauri::Emitter;

/// Start watching an assets folder for changes
/// Emits "assets-changed" event to frontend when files change
#[tauri::command]
pub fn watch_assets_folder(
    app: tauri::AppHandle,
    folder_path: String,
) -> Result<String, String> {
    let path = std::path::Path::new(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Err("Invalid folder path".to_string());
    }

    let folder = folder_path.clone();

    // Spawn watcher thread
    std::thread::spawn(move || {
        use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
        use std::sync::mpsc::channel;
        use std::time::Duration;

        let (tx, rx) = channel();

        let config = Config::default()
            .with_poll_interval(Duration::from_secs(2));

        let mut watcher: RecommendedWatcher = match Watcher::new(tx, config) {
            Ok(w) => w,
            Err(e) => {
                eprintln!("Failed to create watcher: {}", e);
                return;
            }
        };

        if let Err(e) = watcher.watch(std::path::Path::new(&folder), RecursiveMode::Recursive) {
            eprintln!("Failed to watch folder: {}", e);
            return;
        }

        loop {
            match rx.recv_timeout(Duration::from_secs(1)) {
                Ok(Ok(event)) => {
                    // Filter for OGG file changes
                    let ogg_changed = event.paths.iter().any(|p| {
                        p.extension()
                            .map_or(false, |e| e.to_string_lossy().to_lowercase() == "ogg")
                    });

                    if ogg_changed {
                        let files: Vec<String> = event
                            .paths
                            .iter()
                            .filter_map(|p| p.file_name().map(|n| n.to_string_lossy().to_string()))
                            .collect();

                        let _ = app.emit("assets-changed", serde_json::json!({
                            "folder": folder,
                            "files": files,
                            "kind": format!("{:?}", event.kind)
                        }));
                    }
                }
                Ok(Err(e)) => {
                    eprintln!("Watch error: {}", e);
                }
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                    // Continue watching
                }
                Err(_) => break,
            }
        }
    });

    Ok(format!("Watching: {}", folder_path))
}

/// Stop watching
#[tauri::command]
pub fn stop_watching() -> Result<(), String> {
    // The watcher thread will be cleaned up when the app closes
    Ok(())
}
