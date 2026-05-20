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
