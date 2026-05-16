# 9. Database Schema

## 9.1 SQLite Schema (DDL)

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS connection_profiles (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    host        TEXT NOT NULL,
    port        INTEGER NOT NULL DEFAULT 5432,
    database    TEXT NOT NULL,
    username    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),

    CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT port_range CHECK (port BETWEEN 1 AND 65535)
);

CREATE TABLE IF NOT EXISTS annotations (
    id                    TEXT PRIMARY KEY,
    connection_profile_id TEXT NOT NULL,
    schema_name           TEXT NOT NULL,
    table_name            TEXT NOT NULL,
    column_name           TEXT,
    text                  TEXT NOT NULL,
    updated_at            TEXT NOT NULL DEFAULT (datetime('now')),

    CONSTRAINT fk_profile
        FOREIGN KEY (connection_profile_id)
        REFERENCES connection_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT text_max_length CHECK (length(text) <= 500),

    CONSTRAINT uq_annotation
        UNIQUE (connection_profile_id, schema_name, table_name, column_name)
);

CREATE INDEX IF NOT EXISTS idx_annotations_profile
    ON annotations(connection_profile_id);

CREATE INDEX IF NOT EXISTS idx_annotations_lookup
    ON annotations(connection_profile_id, schema_name, table_name);
```

## 9.2 SQLite File Location

```
Windows: C:\Users\{username}\AppData\Roaming\{bundle_id}\schemalift.db
Resolved at runtime via: tauri::api::path::app_data_dir(&config)
```

## 9.3 Migration Strategy

Embedded migration runner — SQL files included via `include_str!()` in `db.rs`. Runs on every app startup; idempotent via `schema_migrations` version table.

## 9.4 Rust Connection Setup

```rust
fn open_db(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
    run_migrations(&conn)?;
    Ok(conn)
}
```

---
