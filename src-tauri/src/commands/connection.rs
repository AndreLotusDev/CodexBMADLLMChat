use tauri::{State, WebviewWindow};
use crate::errors::AppError;
use crate::models::{SchemaTree, TestConnectionParams};
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
    state.connection_manager.lock().await.test(&params).await
}

#[tauri::command]
pub async fn connect_with_saved_profile(
    profile_id: String,
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> Result<SchemaTree, AppError> {
    let profile = state.profile_repo.find(&profile_id)?;
    let password = state.credential_store.retrieve(&profile_id)?;
    let params = TestConnectionParams {
        host: profile.host,
        port: profile.port,
        database: profile.database,
        username: profile.username,
        password,
    };
    let pool = state.connection_manager.lock().await.connect(&params).await?;
    drop(params);
    state.schema_extractor.extract(&pool, &window).await
}
