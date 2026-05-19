// AppError — central error type for all fallible Rust functions.
// All functions return Result<T, AppError>; never use .unwrap()/.expect() in non-test code.

use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum AppError {
    // TODO: populate with variants in Story 1.3+ (Database, Credential, Schema, etc.)
    Internal(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Internal(msg) => write!(f, "Internal error: {msg}"),
        }
    }
}

impl std::error::Error for AppError {}

// Allow Tauri commands to return AppError as an Err variant
impl From<AppError> for String {
    fn from(e: AppError) -> Self {
        e.to_string()
    }
}
