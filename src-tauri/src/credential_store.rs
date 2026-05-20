// Windows Credential Manager integration.
// Stores and retrieves database passwords via the OS keyring (keyring crate).
// Passwords are NEVER stored in the Zustand store or SQLite — only in the OS vault.

use keyring::Entry;
use crate::errors::AppError;

pub struct CredentialStore {
    service_name: String,
}

impl CredentialStore {
    pub fn new(service_name: impl Into<String>) -> Self {
        Self { service_name: service_name.into() }
    }

    pub fn store(&self, profile_id: &str, password: &str) -> Result<(), AppError> {
        let entry = Entry::new(&self.service_name, profile_id)
            .map_err(|e| AppError::CredentialStoreError(e.to_string()))?;
        entry.set_password(password)
            .map_err(|e| AppError::CredentialStoreError(e.to_string()))
    }

    pub fn retrieve(&self, profile_id: &str) -> Result<String, AppError> {
        let entry = Entry::new(&self.service_name, profile_id)
            .map_err(|e| AppError::CredentialStoreError(e.to_string()))?;
        entry.get_password()
            .map_err(|e| AppError::CredentialNotFound(e.to_string()))
    }

    pub fn delete(&self, profile_id: &str) -> Result<(), AppError> {
        let entry = Entry::new(&self.service_name, profile_id)
            .map_err(|e| AppError::CredentialStoreError(e.to_string()))?;
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            // Idempotent delete: NoEntry is not an error for our use case.
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(AppError::CredentialStoreError(e.to_string())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "Requires Windows Credential Manager — run with `cargo test -- --ignored`"]
    fn roundtrip_store_retrieve_delete() {
        let store = CredentialStore::new("schemalift-test");
        let profile_id = format!("test-{}", uuid::Uuid::new_v4());
        store.store(&profile_id, "secret123").unwrap();
        assert_eq!(store.retrieve(&profile_id).unwrap(), "secret123");
        store.delete(&profile_id).unwrap();
        assert!(matches!(store.retrieve(&profile_id), Err(AppError::CredentialNotFound(_))));
    }

    #[test]
    #[ignore = "Requires Windows Credential Manager — run with `cargo test -- --ignored`"]
    fn delete_nonexistent_is_idempotent() {
        let store = CredentialStore::new("schemalift-test");
        let nonexistent = format!("ghost-{}", uuid::Uuid::new_v4());
        assert!(store.delete(&nonexistent).is_ok());
    }
}
