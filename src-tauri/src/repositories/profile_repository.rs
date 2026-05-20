use rusqlite::{Connection, params};
use std::sync::{Arc, Mutex};
use crate::errors::AppError;
use crate::models::{ConnectionProfile, SaveProfileParams};

pub struct ProfileRepository {
    conn: Arc<Mutex<Connection>>,
}

impl ProfileRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }

    pub fn list(&self) -> Result<Vec<ConnectionProfile>, AppError> {
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        let mut stmt = guard.prepare(
            "SELECT id, name, host, port, database, username, created_at
             FROM connection_profiles
             ORDER BY name COLLATE NOCASE ASC"
        ).map_err(|e| AppError::Internal(e.to_string()))?;
        let rows = stmt.query_map([], |row| Ok(ConnectionProfile {
            id: row.get(0)?,
            name: row.get(1)?,
            host: row.get(2)?,
            port: row.get::<_, i64>(3)? as u16,
            database: row.get(4)?,
            username: row.get(5)?,
            created_at: row.get(6)?,
        })).map_err(|e| AppError::Internal(e.to_string()))?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| AppError::Internal(e.to_string()))?);
        }
        Ok(out)
    }

    pub fn insert(&self, params: &SaveProfileParams) -> Result<ConnectionProfile, AppError> {
        let id = uuid::Uuid::new_v4().to_string();
        let created_at = chrono::Utc::now().to_rfc3339();
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        let result = guard.execute(
            "INSERT INTO connection_profiles (id, name, host, port, database, username, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                params.name.trim(),
                params.host.trim(),
                params.port as i64,
                params.database.trim(),
                params.username.trim(),
                created_at
            ],
        );
        match result {
            Ok(_) => Ok(ConnectionProfile {
                id,
                name: params.name.trim().to_string(),
                host: params.host.trim().to_string(),
                port: params.port,
                database: params.database.trim().to_string(),
                username: params.username.trim().to_string(),
                created_at,
            }),
            Err(rusqlite::Error::SqliteFailure(sf, _))
                if sf.code == rusqlite::ErrorCode::ConstraintViolation =>
            {
                Err(AppError::DuplicateProfileName)
            }
            Err(e) => Err(AppError::Internal(e.to_string())),
        }
    }

    pub fn delete(&self, profile_id: &str) -> Result<(), AppError> {
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        let rows = guard.execute(
            "DELETE FROM connection_profiles WHERE id = ?1",
            params![profile_id],
        ).map_err(|e| AppError::Internal(e.to_string()))?;
        if rows == 0 { return Err(AppError::ProfileNotFound); }
        Ok(())
    }

    pub fn rename(&self, profile_id: &str, new_name: &str) -> Result<(), AppError> {
        let trimmed = new_name.trim();
        if trimmed.is_empty() {
            return Err(AppError::InvalidProfileName);
        }
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        let rows = guard.execute(
            "UPDATE connection_profiles SET name = ?1 WHERE id = ?2",
            params![trimmed, profile_id],
        ).map_err(|e| AppError::Internal(e.to_string()))?;
        if rows == 0 { return Err(AppError::ProfileNotFound); }
        Ok(())
    }

    pub fn find(&self, profile_id: &str) -> Result<ConnectionProfile, AppError> {
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        guard.query_row(
            "SELECT id, name, host, port, database, username, created_at
             FROM connection_profiles WHERE id = ?1",
            params![profile_id],
            |row| Ok(ConnectionProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                host: row.get(2)?,
                port: row.get::<_, i64>(3)? as u16,
                database: row.get(4)?,
                username: row.get(5)?,
                created_at: row.get(6)?,
            }),
        ).map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => AppError::ProfileNotFound,
            e => AppError::Internal(e.to_string()),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    fn new_in_memory_repo() -> ProfileRepository {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        conn.execute_batch(include_str!("../migrations/001_initial.sql")).unwrap();
        ProfileRepository::new(Arc::new(Mutex::new(conn)))
    }

    fn sample_params(name: &str) -> SaveProfileParams {
        SaveProfileParams {
            name: name.to_string(),
            host: "localhost".to_string(),
            port: 5432,
            database: "mydb".to_string(),
            username: "postgres".to_string(),
            password: "secret".to_string(),
        }
    }

    #[test]
    fn list_returns_empty_initially() {
        let repo = new_in_memory_repo();
        let profiles = repo.list().unwrap();
        assert!(profiles.is_empty());
    }

    #[test]
    fn insert_returns_profile_with_uuid_and_iso_timestamp() {
        let repo = new_in_memory_repo();
        let p = repo.insert(&sample_params("Prod")).unwrap();
        assert_eq!(p.name, "Prod");
        assert_eq!(p.host, "localhost");
        assert_eq!(p.port, 5432);
        assert_eq!(p.database, "mydb");
        assert_eq!(p.username, "postgres");
        // UUID v4: 36 chars including 4 hyphens
        assert_eq!(p.id.len(), 36);
        assert_eq!(p.id.matches('-').count(), 4);
        // ISO 8601 / RFC 3339 contains the 'T' separator
        assert!(p.created_at.contains('T'), "created_at must be ISO 8601: {}", p.created_at);
    }

    #[test]
    fn list_returns_inserted_profiles_sorted_by_name_case_insensitive() {
        let repo = new_in_memory_repo();
        repo.insert(&sample_params("beta")).unwrap();
        repo.insert(&sample_params("Alpha")).unwrap();
        repo.insert(&sample_params("gamma")).unwrap();
        let profiles = repo.list().unwrap();
        let names: Vec<&str> = profiles.iter().map(|p| p.name.as_str()).collect();
        assert_eq!(names, vec!["Alpha", "beta", "gamma"]);
    }

    #[test]
    fn delete_removes_profile() {
        let repo = new_in_memory_repo();
        let p = repo.insert(&sample_params("ToDelete")).unwrap();
        repo.delete(&p.id).unwrap();
        assert!(repo.list().unwrap().is_empty());
    }

    #[test]
    fn delete_nonexistent_returns_profile_not_found() {
        let repo = new_in_memory_repo();
        let result = repo.delete("ghost-id");
        assert!(matches!(result, Err(AppError::ProfileNotFound)));
    }

    #[test]
    fn find_returns_profile_by_id() {
        let repo = new_in_memory_repo();
        let inserted = repo.insert(&sample_params("FindMe")).unwrap();
        let found = repo.find(&inserted.id).unwrap();
        assert_eq!(found.id, inserted.id);
        assert_eq!(found.name, "FindMe");
    }

    #[test]
    fn find_nonexistent_returns_profile_not_found() {
        let repo = new_in_memory_repo();
        let result = repo.find("ghost-id");
        assert!(matches!(result, Err(AppError::ProfileNotFound)));
    }

    #[test]
    fn insert_trims_whitespace_from_name_host_database_username() {
        let repo = new_in_memory_repo();
        let mut params = sample_params("  Padded  ");
        params.host = "  hosty  ".to_string();
        params.database = "  db  ".to_string();
        params.username = "  user  ".to_string();
        let p = repo.insert(&params).unwrap();
        assert_eq!(p.name, "Padded");
        assert_eq!(p.host, "hosty");
        assert_eq!(p.database, "db");
        assert_eq!(p.username, "user");
    }

    #[test]
    fn insert_empty_name_fails_check_constraint() {
        let repo = new_in_memory_repo();
        let mut params = sample_params("   ");
        params.name = "   ".to_string();
        let result = repo.insert(&params);
        assert!(matches!(result, Err(AppError::DuplicateProfileName)),
            "expected DuplicateProfileName (constraint violation routing), got {:?}", result);
    }

    #[test]
    fn supports_at_least_10_profiles() {
        let repo = new_in_memory_repo();
        for i in 0..12 {
            repo.insert(&sample_params(&format!("Profile{:02}", i))).unwrap();
        }
        let profiles = repo.list().unwrap();
        assert_eq!(profiles.len(), 12);
    }

    #[test]
    fn rename_updates_existing_profile() {
        let repo = new_in_memory_repo();
        let p = repo.insert(&sample_params("Old")).unwrap();
        repo.rename(&p.id, "New").unwrap();
        let listed = repo.list().unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].name, "New");
        assert_eq!(repo.find(&p.id).unwrap().name, "New");
    }

    #[test]
    fn rename_trims_whitespace_in_new_name() {
        let repo = new_in_memory_repo();
        let p = repo.insert(&sample_params("Old")).unwrap();
        repo.rename(&p.id, "  Padded  ").unwrap();
        assert_eq!(repo.find(&p.id).unwrap().name, "Padded");
    }

    #[test]
    fn rename_with_empty_name_returns_invalid_profile_name() {
        let repo = new_in_memory_repo();
        let p = repo.insert(&sample_params("Original")).unwrap();
        let result = repo.rename(&p.id, "");
        assert!(matches!(result, Err(AppError::InvalidProfileName)));
        assert_eq!(repo.find(&p.id).unwrap().name, "Original");
    }

    #[test]
    fn rename_with_whitespace_only_name_returns_invalid_profile_name() {
        let repo = new_in_memory_repo();
        let p = repo.insert(&sample_params("Original")).unwrap();
        let result = repo.rename(&p.id, "   ");
        assert!(matches!(result, Err(AppError::InvalidProfileName)));
        assert_eq!(repo.find(&p.id).unwrap().name, "Original");
    }

    #[test]
    fn rename_nonexistent_returns_profile_not_found() {
        let repo = new_in_memory_repo();
        let result = repo.rename("ghost-id", "Whatever");
        assert!(matches!(result, Err(AppError::ProfileNotFound)));
    }

    #[test]
    fn rename_does_not_affect_other_profiles() {
        let repo = new_in_memory_repo();
        let a = repo.insert(&sample_params("Alpha")).unwrap();
        let b = repo.insert(&sample_params("Beta")).unwrap();
        repo.rename(&a.id, "AlphaRenamed").unwrap();
        assert_eq!(repo.find(&a.id).unwrap().name, "AlphaRenamed");
        assert_eq!(repo.find(&b.id).unwrap().name, "Beta");
    }

    #[test]
    fn migration_is_idempotent() {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        conn.execute_batch(include_str!("../migrations/001_initial.sql")).unwrap();
        // Run again — should not error.
        conn.execute_batch(include_str!("../migrations/001_initial.sql")).unwrap();
        // Insert version row twice via INSERT OR IGNORE pattern (simulating db::run_migrations)
        conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)", []).unwrap();
        conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)", []).unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM schema_migrations WHERE version = 1",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }
}
