use rusqlite::{Connection, params};
use std::sync::{Arc, Mutex};
use crate::errors::AppError;
use crate::models::{Annotation, UpsertAnnotationParams};

pub struct AnnotationRepository {
    conn: Arc<Mutex<Connection>>,
}

impl AnnotationRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }

    pub fn list_for_profile(&self, profile_id: &str) -> Result<Vec<Annotation>, AppError> {
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        let mut stmt = guard.prepare(
            "SELECT id, connection_profile_id, schema_name, table_name, column_name, text, updated_at
             FROM annotations
             WHERE connection_profile_id = ?1
             ORDER BY schema_name COLLATE NOCASE ASC,
                      table_name  COLLATE NOCASE ASC,
                      column_name COLLATE NOCASE ASC NULLS FIRST"
        ).map_err(|e| AppError::Internal(e.to_string()))?;
        let rows = stmt.query_map(params![profile_id], |row| Ok(Annotation {
            id: row.get(0)?,
            connection_profile_id: row.get(1)?,
            schema_name: row.get(2)?,
            table_name: row.get(3)?,
            column_name: row.get(4)?,
            text: row.get(5)?,
            updated_at: row.get(6)?,
        })).map_err(|e| AppError::Internal(e.to_string()))?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| AppError::Internal(e.to_string()))?);
        }
        Ok(out)
    }

    pub fn upsert(&self, params: &UpsertAnnotationParams) -> Result<Annotation, AppError> {
        if params.text.chars().count() > 500 {
            return Err(AppError::AnnotationTooLong);
        }
        let new_id = uuid::Uuid::new_v4().to_string();
        let updated_at = chrono::Utc::now().to_rfc3339();
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        let result = guard.execute(
            "INSERT INTO annotations
                 (id, connection_profile_id, schema_name, table_name, column_name, text, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(connection_profile_id, schema_name, table_name, column_name)
             DO UPDATE SET text = excluded.text, updated_at = excluded.updated_at",
            params![
                new_id,
                params.profile_id,
                params.schema_name,
                params.table_name,
                params.column_name,
                params.text,
                updated_at,
            ],
        );
        match result {
            Ok(_) => {}
            Err(rusqlite::Error::SqliteFailure(sf, _))
                if sf.code == rusqlite::ErrorCode::ConstraintViolation =>
            {
                return Err(AppError::ProfileNotFound);
            }
            Err(e) => return Err(AppError::Internal(e.to_string())),
        }
        guard.query_row(
            "SELECT id, connection_profile_id, schema_name, table_name, column_name, text, updated_at
             FROM annotations
             WHERE connection_profile_id = ?1
               AND schema_name = ?2
               AND table_name  = ?3
               AND ((column_name IS NULL AND ?4 IS NULL) OR column_name = ?4)",
            params![params.profile_id, params.schema_name, params.table_name, params.column_name],
            |row| Ok(Annotation {
                id: row.get(0)?,
                connection_profile_id: row.get(1)?,
                schema_name: row.get(2)?,
                table_name: row.get(3)?,
                column_name: row.get(4)?,
                text: row.get(5)?,
                updated_at: row.get(6)?,
            }),
        ).map_err(|e| AppError::Internal(e.to_string()))
    }

    pub fn delete(&self, annotation_id: &str) -> Result<(), AppError> {
        let guard = self.conn.lock().map_err(|e| AppError::Internal(format!("DB lock poisoned: {e}")))?;
        let rows = guard.execute(
            "DELETE FROM annotations WHERE id = ?1",
            params![annotation_id],
        ).map_err(|e| AppError::Internal(e.to_string()))?;
        if rows == 0 { return Err(AppError::Internal("Annotation not found".to_string())); }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::SaveProfileParams;
    use crate::repositories::profile_repository::ProfileRepository;

    fn new_in_memory_repos() -> (AnnotationRepository, ProfileRepository) {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        conn.execute_batch(include_str!("../migrations/001_initial.sql")).unwrap();
        let shared = Arc::new(Mutex::new(conn));
        (AnnotationRepository::new(shared.clone()), ProfileRepository::new(shared))
    }

    fn sample_profile(repo: &ProfileRepository, name: &str) -> String {
        repo.insert(&SaveProfileParams {
            name: name.into(),
            host: "localhost".into(),
            port: 5432,
            database: "db".into(),
            username: "u".into(),
            password: "p".into(),
        }).unwrap().id
    }

    fn upsert_params(profile_id: &str, table: &str, column: Option<&str>, text: &str) -> UpsertAnnotationParams {
        UpsertAnnotationParams {
            profile_id: profile_id.into(),
            schema_name: "public".into(),
            table_name: table.into(),
            column_name: column.map(|s| s.into()),
            text: text.into(),
        }
    }

    #[test]
    fn upsert_inserts_new_row_when_absent() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid = sample_profile(&profile_repo, "p1");
        assert!(anno_repo.list_for_profile(&pid).unwrap().is_empty());

        let saved = anno_repo.upsert(&upsert_params(&pid, "users", None, "hello")).unwrap();
        assert_eq!(saved.text, "hello");
        assert_eq!(saved.table_name, "users");
        assert!(saved.column_name.is_none());
        assert_eq!(saved.id.len(), 36);

        let listed = anno_repo.list_for_profile(&pid).unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, saved.id);
    }

    #[test]
    fn upsert_updates_existing_row_on_same_natural_key() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid = sample_profile(&profile_repo, "p1");
        let first = anno_repo.upsert(&upsert_params(&pid, "users", None, "first")).unwrap();
        let second = anno_repo.upsert(&upsert_params(&pid, "users", None, "second")).unwrap();

        // id stable across upserts (ON CONFLICT keeps original row id)
        assert_eq!(first.id, second.id);
        assert_eq!(second.text, "second");

        let listed = anno_repo.list_for_profile(&pid).unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].text, "second");
    }

    #[test]
    fn upsert_with_text_over_500_chars_returns_annotation_too_long() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid = sample_profile(&profile_repo, "p1");
        let long_text = "a".repeat(501);
        let result = anno_repo.upsert(&upsert_params(&pid, "users", None, &long_text));
        assert!(matches!(result, Err(AppError::AnnotationTooLong)),
            "expected AnnotationTooLong, got {:?}", result);
    }

    #[test]
    fn upsert_with_unknown_profile_id_returns_profile_not_found() {
        let (anno_repo, _profile_repo) = new_in_memory_repos();
        let result = anno_repo.upsert(&upsert_params("ghost-profile", "users", None, "hi"));
        assert!(matches!(result, Err(AppError::ProfileNotFound)),
            "expected ProfileNotFound for FK violation, got {:?}", result);
    }

    #[test]
    fn list_for_profile_returns_only_matching_profile() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid_a = sample_profile(&profile_repo, "A");
        let pid_b = sample_profile(&profile_repo, "B");
        anno_repo.upsert(&upsert_params(&pid_a, "users", None, "for A")).unwrap();
        anno_repo.upsert(&upsert_params(&pid_b, "users", None, "for B1")).unwrap();
        anno_repo.upsert(&upsert_params(&pid_b, "orders", None, "for B2")).unwrap();

        let for_a = anno_repo.list_for_profile(&pid_a).unwrap();
        let for_b = anno_repo.list_for_profile(&pid_b).unwrap();
        assert_eq!(for_a.len(), 1);
        assert_eq!(for_a[0].text, "for A");
        assert_eq!(for_b.len(), 2);
    }

    #[test]
    fn list_for_profile_sorts_table_level_before_column_level() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid = sample_profile(&profile_repo, "p");
        // Insert column-level first, then table-level — order should still be table first via NULLS FIRST.
        anno_repo.upsert(&upsert_params(&pid, "users", Some("id"), "col anno")).unwrap();
        anno_repo.upsert(&upsert_params(&pid, "users", None, "table anno")).unwrap();

        let listed = anno_repo.list_for_profile(&pid).unwrap();
        assert_eq!(listed.len(), 2);
        assert!(listed[0].column_name.is_none(), "expected table-level (NULL column_name) first");
        assert_eq!(listed[0].text, "table anno");
        assert_eq!(listed[1].column_name.as_deref(), Some("id"));
    }

    #[test]
    fn delete_removes_row() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid = sample_profile(&profile_repo, "p");
        let saved = anno_repo.upsert(&upsert_params(&pid, "users", None, "x")).unwrap();
        anno_repo.delete(&saved.id).unwrap();
        assert!(anno_repo.list_for_profile(&pid).unwrap().is_empty());
    }

    #[test]
    fn delete_nonexistent_returns_error() {
        let (anno_repo, _profile_repo) = new_in_memory_repos();
        let result = anno_repo.delete("ghost-id");
        assert!(result.is_err());
    }

    #[test]
    fn delete_profile_cascades_to_annotations() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid = sample_profile(&profile_repo, "ToDelete");
        anno_repo.upsert(&upsert_params(&pid, "users", None, "a1")).unwrap();
        anno_repo.upsert(&upsert_params(&pid, "users", Some("id"), "a2")).unwrap();
        anno_repo.upsert(&upsert_params(&pid, "orders", None, "a3")).unwrap();
        assert_eq!(anno_repo.list_for_profile(&pid).unwrap().len(), 3);

        profile_repo.delete(&pid).unwrap();

        // FK cascade: all 3 annotations gone.
        assert!(anno_repo.list_for_profile(&pid).unwrap().is_empty(),
            "AC4: ON DELETE CASCADE should remove all annotations for the deleted profile");
    }

    #[test]
    fn upsert_handles_null_column_name_for_table_annotations() {
        let (anno_repo, profile_repo) = new_in_memory_repos();
        let pid = sample_profile(&profile_repo, "p");
        let first = anno_repo.upsert(&upsert_params(&pid, "users", None, "first")).unwrap();
        let second = anno_repo.upsert(&upsert_params(&pid, "users", None, "second")).unwrap();
        // Re-read by natural key with NULL column_name must succeed and return the same row.
        assert_eq!(first.id, second.id);
        assert_eq!(second.text, "second");
        assert_eq!(anno_repo.list_for_profile(&pid).unwrap().len(), 1);
    }
}
