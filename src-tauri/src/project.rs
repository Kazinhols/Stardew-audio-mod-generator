use crate::ProjectData;
use chrono::Local;
use std::fs;
use tauri::Manager;

/// Save project to a specific path
#[tauri::command]
pub fn save_project(path: String, data: ProjectData) -> Result<String, String> {
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(format!("Project saved to: {}", path))
}

/// Load project from a specific path
#[tauri::command]
pub fn load_project(path: String) -> Result<ProjectData, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let data: ProjectData = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(data)
}

/// Get list of recent projects from app data
#[tauri::command]
pub fn get_recent_projects(app: tauri::AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let projects_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("projects");

    let mut projects = Vec::new();

    if projects_dir.exists() {
        for entry in fs::read_dir(&projects_dir).map_err(|e| e.to_string())? {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.extension().map_or(false, |e| e == "json") {
                    if let Ok(metadata) = fs::metadata(&path) {
                        let name = path
                            .file_stem()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string();
                        let modified = metadata
                            .modified()
                            .ok()
                            .and_then(|t| {
                                let datetime: chrono::DateTime<Local> = t.into();
                                Some(datetime.format("%Y-%m-%d %H:%M").to_string())
                            })
                            .unwrap_or_default();
                        let size = metadata.len();

                        projects.push(serde_json::json!({
                            "name": name,
                            "path": path.to_string_lossy(),
                            "modified": modified,
                            "size": size
                        }));
                    }
                }
            }
        }
    }

    // Sort by modified date (newest first)
    projects.sort_by(|a, b| {
        let a_mod = a["modified"].as_str().unwrap_or("");
        let b_mod = b["modified"].as_str().unwrap_or("");
        b_mod.cmp(a_mod)
    });

    Ok(projects)
}

/// Auto-save project to app data directory
#[tauri::command]
pub fn auto_save_project(app: tauri::AppHandle, data: ProjectData) -> Result<String, String> {
    let autosave_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("autosave");
    fs::create_dir_all(&autosave_dir).map_err(|e| e.to_string())?;

    let path = autosave_dir.join("autosave.json");
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;

    Ok(path.to_string_lossy().to_string())
}

/// Load auto-saved project
#[tauri::command]
pub fn load_auto_save(app: tauri::AppHandle) -> Result<Option<ProjectData>, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("autosave/autosave.json");

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let data: ProjectData = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(data))
}
