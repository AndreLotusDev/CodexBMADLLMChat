// Windows Credential Manager integration.
// Stores and retrieves database passwords via the OS keyring (keyring crate).
// Passwords are NEVER stored in the Zustand store or SQLite — only in the OS vault.

use keyring::Entry;
use crate::errors::AppError;

// Actionable user-facing message returned when a saved profile's password is missing
// from Windows Credential Manager (the keyring entry was deleted, never written, or
// the SQLite row was copied across machines). Single source of truth for AC1.
const MISSING_CREDENTIAL_MESSAGE: &str =
    "This profile's password is missing from Windows Credential Manager. \
     Re-save this profile from the Connection screen to restore its password.";

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
        match entry.get_password() {
            Ok(password) => Ok(password),
            // Exact-variant match — the keyring crate guarantees NoEntry across platforms,
            // so we never fall back to substring inspection of the underlying error text.
            Err(keyring::Error::NoEntry) => {
                Err(AppError::CredentialNotFound(MISSING_CREDENTIAL_MESSAGE.to_string()))
            }
            // Any other failure (PlatformFailure, NoStorageAccess, ...) is an OS-level
            // problem the user cannot remediate by re-saving — route to CredentialStoreError.
            Err(e) => Err(AppError::CredentialStoreError(
                format!("Could not access Windows Credential Manager: {e}")
            )),
        }
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
        // Lock in the AC1 payload contract: after the entry is gone, retrieve must
        // surface CredentialNotFound with an actionable message that points the user
        // at re-saving from the Connection screen.
        match store.retrieve(&profile_id) {
            Err(AppError::CredentialNotFound(msg)) => {
                assert!(
                    msg.contains("Re-save") && msg.contains("Connection"),
                    "expected actionable remediation text, got: {msg}"
                );
                assert!(
                    !msg.contains("No matching entry found in secure storage"),
                    "raw keyring crate text must not leak into the payload: {msg}"
                );
            }
            other => panic!("expected CredentialNotFound, got {other:?}"),
        }
    }

    #[test]
    #[ignore = "Requires Windows Credential Manager — run with `cargo test -- --ignored`"]
    fn delete_nonexistent_is_idempotent() {
        let store = CredentialStore::new("schemalift-test");
        let nonexistent = format!("ghost-{}", uuid::Uuid::new_v4());
        assert!(store.delete(&nonexistent).is_ok());
    }
}
