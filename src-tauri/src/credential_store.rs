// Windows Credential Manager integration.
// Stores and retrieves database passwords via the OS keyring (keyring crate).
// Passwords are NEVER stored in the Zustand store or SQLite — only in the OS vault.

// TODO: implement store/retrieve/delete in Story 1.3 using the keyring crate.
