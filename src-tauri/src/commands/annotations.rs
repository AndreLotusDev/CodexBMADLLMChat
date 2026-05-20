use tauri::State;
use crate::errors::AppError;
use crate::models::{Annotation, UpsertAnnotationParams};
use crate::AppState;

#[tauri::command]
pub async fn load_annotations(
    profile_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Annotation>, AppError> {
    state.annotation_repo.list_for_profile(&profile_id)
}

#[tauri::command]
pub async fn upsert_annotation(
    profile_id: String,
    schema_name: String,
    table_name: String,
    column_name: Option<String>,
    text: String,
    state: State<'_, AppState>,
) -> Result<Annotation, AppError> {
    let params = UpsertAnnotationParams {
        profile_id, schema_name, table_name, column_name, text,
    };
    state.annotation_repo.upsert(&params)
}

#[tauri::command]
pub async fn delete_annotation(
    annotation_id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.annotation_repo.delete(&annotation_id)
}
