use tauri::{State, WebviewWindow};
use crate::errors::AppError;
use crate::models::{SchemaTree, TestConnectionParams};
use crate::AppState;

#[tauri::command]
pub async fn connect_and_extract_schema(
    host: String,
    port: u16,
    database: String,
    username: String,
    password: String,
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> Result<SchemaTree, AppError> {
    let params = TestConnectionParams { host, port, database, username, password };
    let pool = state.connection_manager.lock().await.connect(&params).await?;
    state.schema_extractor.extract(&pool, &window).await
}

#[tauri::command]
pub async fn disconnect(
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.connection_manager.lock().await.disconnect().await
}
