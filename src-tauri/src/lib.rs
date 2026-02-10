mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::save_project,
      commands::load_project,
      commands::auto_save_project,
      commands::load_auto_save,
      commands::export_to_zip,
      commands::export_to_folder,
      commands::generate_manifest_json,
      commands::generate_content_json,
      commands::generate_i18n_json
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
