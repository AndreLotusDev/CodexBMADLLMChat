use tauri::State;
use crate::errors::AppError;
use crate::models::{ConnectionProfile, SaveProfileParams};
use crate::AppState;

#[tauri::command]
pub async fn list_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<ConnectionProfile>, AppError> {
    state.profile_repo.list()
}

#[tauri::command]
pub async fn save_profile(
    name: String,
    host: String,
    port: u16,
    database: String,
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<ConnectionProfile, AppError> {
    let params = SaveProfileParams { name, host, port, database, username, password };
    let profile = state.profile_repo.insert(&params)?;
    if let Err(e) = state.credential_store.store(&profile.id, &params.password) {
        // Compensation: roll back SQLite row so we don't leave an orphan profile with no credentials.
        let _ = state.profile_repo.delete(&profile.id);
        return Err(e);
    }
    drop(params); // explicit drop per architecture §17.3 ("Drop sensitive strings explicitly")
    Ok(profile)
}

#[tauri::command]
pub async fn delete_profile(
    profile_id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.profile_repo.delete(&profile_id)?;
    state.credential_store.delete(&profile_id)?;
    Ok(())
}

#[tauri::command]
pub async fn rename_profile(
    profile_id: String,
    new_name: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.profile_repo.rename(&profile_id, &new_name)
}
