use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionParams {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveProfileParams {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaTree {
    pub schemas: Vec<PgSchema>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PgSchema {
    pub name: String,
    pub tables: Vec<PgTable>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PgTable {
    pub schema_name: String,
    pub name: String,
    pub columns: Vec<PgColumn>,
    pub primary_keys: Vec<String>,
    pub foreign_keys: Vec<ForeignKey>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PgColumn {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub is_primary_key: bool,
    pub foreign_key_ref: Option<ForeignKeyRef>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ForeignKey {
    pub constraint_name: String,
    pub column_name: String,
    pub referenced_schema: String,
    pub referenced_table: String,
    pub referenced_column: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ForeignKeyRef {
    pub schema: String,
    pub table: String,
    pub column: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Annotation {
    pub id: String,
    pub connection_profile_id: String,
    pub schema_name: String,
    pub table_name: String,
    pub column_name: Option<String>,
    pub text: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertAnnotationParams {
    pub profile_id: String,
    pub schema_name: String,
    pub table_name: String,
    pub column_name: Option<String>,
    pub text: String,
}
