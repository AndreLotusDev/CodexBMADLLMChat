pub mod errors;
pub mod models;
pub mod db;
pub mod credential_store;
pub mod commands;
pub mod services;
pub mod repositories;

use services::connection_manager::ConnectionManager;

pub struct AppState {
    pub connection_manager: ConnectionManager,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        connection_manager: ConnectionManager::new(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![commands::connection::test_connection])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
