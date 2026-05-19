use tauri::State;
use crate::errors::AppError;
use crate::models::TestConnectionParams;
use crate::AppState;

#[tauri::command]
pub async fn test_connection(
    host: String,
    port: u16,
    database: String,
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let params = TestConnectionParams { host, port, database, username, password };
    state.connection_manager.test(&params).await
}
