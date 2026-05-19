// Module declarations — all modules live as sibling files or subdirectories.
pub mod errors;
pub mod models;
pub mod db;
pub mod credential_store;
pub mod commands;
pub mod services;
pub mod repositories;

// Placeholder command kept from scaffold; removed in Story 1.3.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
