// SQLite connection helper.
// Every SQLite connection MUST go through open_db() — never call Connection::open() directly.
// open_db() sets required PRAGMAs (foreign_keys, journal_mode) and runs migrations on every open.

use rusqlite::Connection;
use std::path::Path;
use crate::errors::AppError;

/// Opens (or creates) the SQLite database at `path`, enables required PRAGMAs,
/// and runs the migration runner. Per architecture §17.1 ("SQLite Pragma on Open"),
/// every connection MUST go through this function — never call `Connection::open()` directly.
pub fn open_db(path: &Path) -> Result<Connection, AppError> {
    let conn = Connection::open(path)
        .map_err(|e| AppError::Internal(format!("Failed to open SQLite at {:?}: {e}", path)))?;
    conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")
        .map_err(|e| AppError::Internal(format!("PRAGMA setup failed: {e}")))?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    const MIGRATION_001: &str = include_str!("./migrations/001_initial.sql");
    conn.execute_batch(MIGRATION_001)
        .map_err(|e| AppError::Internal(format!("Migration 001 failed: {e}")))?;
    conn.execute(
        "INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)",
        [],
    ).map_err(|e| AppError::Internal(format!("Migration version insert failed: {e}")))?;
    Ok(())
}
