pub mod errors;
pub mod models;
pub mod db;
pub mod credential_store;
pub mod commands;
pub mod services;
pub mod repositories;

use std::sync::{Arc, Mutex};
use services::connection_manager::ConnectionManager;
use services::schema_extractor::SchemaExtractor;
use repositories::profile_repository::ProfileRepository;
use repositories::annotation_repository::AnnotationRepository;
use credential_store::CredentialStore;

pub struct AppState {
    pub connection_manager: tokio::sync::Mutex<ConnectionManager>,
    pub schema_extractor: SchemaExtractor,
    pub profile_repo: ProfileRepository,
    pub annotation_repo: AnnotationRepository,
    pub credential_store: CredentialStore,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to resolve app data directory");
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");
            let db_path = app_data_dir.join("schemalift.db");
            let conn = db::open_db(&db_path)
                .expect("Failed to open SQLite database");
            let conn_arc = Arc::new(Mutex::new(conn));
            let app_state = AppState {
                connection_manager: tokio::sync::Mutex::new(ConnectionManager::new()),
                schema_extractor: SchemaExtractor::new(),
                profile_repo: ProfileRepository::new(conn_arc.clone()),
                annotation_repo: AnnotationRepository::new(conn_arc.clone()),
                credential_store: CredentialStore::new("schemalift"),
            };
            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::connection::test_connection,
            commands::connection::connect_with_saved_profile,
            commands::schema::connect_and_extract_schema,
            commands::schema::disconnect,
            commands::profiles::list_profiles,
            commands::profiles::save_profile,
            commands::profiles::delete_profile,
            commands::profiles::rename_profile,
            commands::annotations::load_annotations,
            commands::annotations::upsert_annotation,
            commands::annotations::delete_annotation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
