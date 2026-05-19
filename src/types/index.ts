export interface ConnectionProfile {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  createdAt: string
}

export interface TauriCommandError {
  code: string
  message: string
}

export interface TestConnectionParams {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface SchemaTree {
  schemas: PgSchema[]
}

export interface PgSchema {
  name: string
  tables: PgTable[]
}

export interface PgTable {
  schemaName: string
  name: string
  columns: PgColumn[]
  primaryKeys: string[]
  foreignKeys: ForeignKey[]
}

export interface PgColumn {
  name: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
  foreignKeyRef?: ForeignKeyRef
}

export interface ForeignKey {
  constraintName: string
  columnName: string
  referencedSchema: string
  referencedTable: string
  referencedColumn: string
}

export interface ForeignKeyRef {
  schema: string
  table: string
  column: string
}
