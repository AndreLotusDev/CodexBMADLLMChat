use std::collections::{HashMap, HashSet};
use sqlx::Row;
use tauri::{Emitter, WebviewWindow};

use crate::errors::AppError;
use crate::models::{ForeignKey, ForeignKeyRef, PgColumn, PgSchema, PgTable, SchemaTree};

pub struct SchemaExtractor;

impl SchemaExtractor {
    pub fn new() -> Self {
        Self
    }

    pub async fn extract(&self, pool: &sqlx::PgPool, window: &WebviewWindow) -> Result<SchemaTree, AppError> {
        let schema_rows = sqlx::query(
            "SELECT schema_name FROM information_schema.schemata \
             WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') \
               AND schema_name NOT LIKE 'pg_temp_%' \
               AND schema_name NOT LIKE 'pg_toast_temp_%' \
             ORDER BY schema_name",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::ExtractionFailed(e.to_string()))?;

        let schema_names: Vec<String> = schema_rows
            .iter()
            .map(|r| r.try_get("schema_name").unwrap_or_default())
            .collect();

        let table_rows = sqlx::query(
            "SELECT table_schema, table_name FROM information_schema.tables \
             WHERE table_type = 'BASE TABLE' \
               AND table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast') \
               AND table_schema NOT LIKE 'pg_temp_%' \
             ORDER BY table_schema, table_name",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::ExtractionFailed(e.to_string()))?;

        let column_rows = sqlx::query(
            "SELECT table_schema, table_name, column_name, data_type, \
                    (is_nullable = 'YES') AS is_nullable \
             FROM information_schema.columns \
             WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast') \
               AND table_schema NOT LIKE 'pg_temp_%' \
             ORDER BY table_schema, table_name, ordinal_position",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::ExtractionFailed(e.to_string()))?;

        let pk_rows = sqlx::query(
            "SELECT tc.table_schema, tc.table_name, kcu.column_name \
             FROM information_schema.table_constraints tc \
             JOIN information_schema.key_column_usage kcu \
               ON tc.constraint_name = kcu.constraint_name \
              AND tc.constraint_schema = kcu.constraint_schema \
             WHERE tc.constraint_type = 'PRIMARY KEY' \
               AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast') \
               AND tc.table_schema NOT LIKE 'pg_temp_%'",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::ExtractionFailed(e.to_string()))?;

        let fk_rows = sqlx::query(
            "SELECT tc.table_schema, tc.table_name, kcu.column_name, \
                    ccu.table_schema AS referenced_schema, \
                    ccu.table_name  AS referenced_table, \
                    ccu.column_name AS referenced_column, \
                    tc.constraint_name \
             FROM information_schema.table_constraints tc \
             JOIN information_schema.key_column_usage kcu \
               ON tc.constraint_name = kcu.constraint_name \
              AND tc.constraint_schema = kcu.constraint_schema \
             JOIN information_schema.referential_constraints rc \
               ON tc.constraint_name = rc.constraint_name \
              AND tc.constraint_schema = rc.constraint_schema \
             JOIN information_schema.key_column_usage ccu \
               ON rc.unique_constraint_name = ccu.constraint_name \
              AND rc.unique_constraint_schema = ccu.constraint_schema \
             WHERE tc.constraint_type = 'FOREIGN KEY' \
               AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast') \
               AND tc.table_schema NOT LIKE 'pg_temp_%' \
             ORDER BY tc.table_schema, tc.table_name, kcu.column_name",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::ExtractionFailed(e.to_string()))?;

        // Build pk_set: (schema, table) -> Set<column>
        let mut pk_set: HashMap<(String, String), HashSet<String>> = HashMap::new();
        for row in &pk_rows {
            let schema: String = row.try_get("table_schema").unwrap_or_default();
            let table: String = row.try_get("table_name").unwrap_or_default();
            let column: String = row.try_get("column_name").unwrap_or_default();
            pk_set.entry((schema, table)).or_default().insert(column);
        }

        // Build fk_map: (schema, table, column) -> ForeignKeyRef
        // Build fk_list_map: (schema, table) -> Vec<ForeignKey>
        let mut fk_map: HashMap<(String, String, String), ForeignKeyRef> = HashMap::new();
        let mut fk_list_map: HashMap<(String, String), Vec<ForeignKey>> = HashMap::new();
        for row in &fk_rows {
            let schema: String = row.try_get("table_schema").unwrap_or_default();
            let table: String = row.try_get("table_name").unwrap_or_default();
            let column: String = row.try_get("column_name").unwrap_or_default();
            let ref_schema: String = row.try_get("referenced_schema").unwrap_or_default();
            let ref_table: String = row.try_get("referenced_table").unwrap_or_default();
            let ref_column: String = row.try_get("referenced_column").unwrap_or_default();
            let constraint_name: String = row.try_get("constraint_name").unwrap_or_default();

            fk_map.insert(
                (schema.clone(), table.clone(), column.clone()),
                ForeignKeyRef { schema: ref_schema.clone(), table: ref_table.clone(), column: ref_column.clone() },
            );
            fk_list_map.entry((schema, table)).or_default().push(ForeignKey {
                constraint_name,
                column_name: column,
                referenced_schema: ref_schema,
                referenced_table: ref_table,
                referenced_column: ref_column,
            });
        }

        // Build column_map: (schema, table) -> Vec<PgColumn>
        let mut column_map: HashMap<(String, String), Vec<PgColumn>> = HashMap::new();
        for row in &column_rows {
            let schema: String = row.try_get("table_schema").unwrap_or_default();
            let table: String = row.try_get("table_name").unwrap_or_default();
            let col_name: String = row.try_get("column_name").unwrap_or_default();
            let data_type: String = row.try_get("data_type").unwrap_or_default();
            let is_nullable: bool = row.try_get("is_nullable").unwrap_or(false);

            let is_pk = pk_set
                .get(&(schema.clone(), table.clone()))
                .map(|s| s.contains(&col_name))
                .unwrap_or(false);
            let foreign_key_ref = fk_map.get(&(schema.clone(), table.clone(), col_name.clone())).cloned();

            column_map.entry((schema, table)).or_default().push(PgColumn {
                name: col_name,
                data_type,
                is_nullable,
                is_primary_key: is_pk,
                foreign_key_ref,
            });
        }

        // Assemble tables, emitting progress per table
        let total_tables = table_rows.len();
        window.emit("schema_progress", serde_json::json!({ "tablesLoaded": 0, "totalTables": total_tables })).ok();

        let mut table_map: HashMap<String, Vec<PgTable>> = HashMap::new();
        for (i, row) in table_rows.iter().enumerate() {
            let schema: String = row.try_get("table_schema").unwrap_or_default();
            let table: String = row.try_get("table_name").unwrap_or_default();

            let columns = column_map.remove(&(schema.clone(), table.clone())).unwrap_or_default();
            let primary_keys = pk_set
                .get(&(schema.clone(), table.clone()))
                .map(|s| s.iter().cloned().collect())
                .unwrap_or_default();
            let foreign_keys = fk_list_map.remove(&(schema.clone(), table.clone())).unwrap_or_default();

            table_map.entry(schema.clone()).or_default().push(PgTable {
                schema_name: schema,
                name: table,
                columns,
                primary_keys,
                foreign_keys,
            });

            window.emit("schema_progress", serde_json::json!({ "tablesLoaded": i + 1, "totalTables": total_tables })).ok();
        }

        let schemas = schema_names
            .into_iter()
            .map(|name| {
                let tables = table_map.remove(&name).unwrap_or_default();
                PgSchema { name, tables }
            })
            .collect();

        Ok(SchemaTree { schemas })
    }
}
