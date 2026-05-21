use thiserror::Error;
use serde::Serialize;

// Serde uses each variant's payload (`(String)` / `(u64)` / unit) as the `message` field
// reaching the frontend — NOT the `#[error("...")]` Display string. The Display strings
// here are for `Debug`/logs only. Mutating them does not change user-visible text.
#[derive(Debug, Error, Serialize)]
#[serde(tag = "code", content = "message")]
pub enum AppError {
    #[error("Could not reach host. Check the hostname and port.")]
    HostUnreachable(String),
    #[error("Authentication failed. Check your username and password.")]
    AuthFailed(String),
    #[error("Database not found. Check the database name.")]
    DatabaseNotFound(String),
    #[error("Connection timed out after {0} seconds.")]
    ConnectionTimeout(u64),
    #[error("Internal error: {0}")]
    Internal(String),
    #[error("Schema extraction failed: {0}")]
    ExtractionFailed(String),
    #[error("Profile not found.")]
    ProfileNotFound,
    #[error("A profile with this name already exists.")]
    DuplicateProfileName,
    #[error("Profile name cannot be empty.")]
    InvalidProfileName,
    #[error("Failed to store credentials securely: {0}")]
    CredentialStoreError(String),
    #[error("Failed to retrieve credentials: {0}")]
    CredentialNotFound(String),
    #[error("Annotation text exceeds 500 character limit.")]
    AnnotationTooLong,
}

impl From<AppError> for String {
    fn from(e: AppError) -> Self {
        e.to_string()
    }
}
