# 4. Data Models

## 4.1 ConnectionProfile

**Purpose:** Represents a saved PostgreSQL connection. Persisted in SQLite. Password is stored separately in Windows Credential Manager, keyed by the profile's `id`.

**Key Attributes:**
- `id`: `string` (UUID) — stable key used as WinCred target name
- `name`: `string` — user-assigned display name (e.g., "Prod DB")
- `host`: `string` — server hostname or IP
- `port`: `number` — default 5432
- `database`: `string` — database name
- `username`: `string` — login user
- `createdAt`: `string` (ISO 8601)

### TypeScript Interface

```typescript
interface ConnectionProfile {
  id: string;          // UUID, stable WinCred key
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  createdAt: string;
}

// Password is NEVER in this object — fetched from WinCred separately at connect time
```

### Relationships
- One ConnectionProfile → many Annotations (cascade delete)
- One ConnectionProfile → one password entry in Windows Credential Manager

---

## 4.2 SchemaTree (Runtime)

**Purpose:** The full schema metadata returned by the Rust extractor after a successful connection. Held in Zustand memory only — never persisted to SQLite.

### TypeScript Interface

```typescript
interface SchemaTree {
  schemas: PgSchema[];
}

interface PgSchema {
  name: string;
  tables: PgTable[];
}

interface PgTable {
  schemaName: string;
  name: string;
  columns: PgColumn[];
  primaryKeys: string[];
  foreignKeys: ForeignKey[];
}

interface PgColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  foreignKeyRef?: ForeignKeyRef;
}

interface ForeignKey {
  constraintName: string;
  columnName: string;
  referencedSchema: string;
  referencedTable: string;
  referencedColumn: string;
}

interface ForeignKeyRef {
  schema: string;
  table: string;
  column: string;
}
```

### Relationships
- Populated on connect; cleared on disconnect
- Merged with Annotations from SQLite at load time to produce the UI's annotated view

---

## 4.3 Annotation

**Purpose:** User-authored plain-text description for a table or column. Persisted in SQLite, keyed by profile + schema + table + optional column. `columnName: null` means the annotation is on the table itself.

**Key Attributes:**
- `id`: `string` (UUID)
- `connectionProfileId`: `string` — FK to ConnectionProfile
- `schemaName`: `string`
- `tableName`: `string`
- `columnName`: `string | null` — null = table-level annotation
- `text`: `string` — max 500 chars
- `updatedAt`: `string` (ISO 8601)

### TypeScript Interface

```typescript
interface Annotation {
  id: string;
  connectionProfileId: string;
  schemaName: string;
  tableName: string;
  columnName: string | null;
  text: string;
  updatedAt: string;
}

type AnnotationKey = `${string}.${string}.${string | ""}`;
// e.g., "public.users." (table) or "public.users.email" (column)
```

### Relationships
- Many Annotations → one ConnectionProfile (cascade delete on profile delete)
- Merged onto SchemaTree nodes at load time for display

---

## 4.4 SelectionState (Runtime)

**Purpose:** Tracks which tables and columns the user has checked for inclusion in the prompt. UI state only — not persisted.

```typescript
interface SelectionState {
  tables: Set<string>;    // "schema.table"
  columns: Set<string>;   // "schema.table.column"
}
```

---

## 4.5 PromptBlock (Runtime)

**Purpose:** The assembled, ready-to-copy LLM prompt string. Produced by the Rust `generate_prompt` command; held transiently in Zustand.

```typescript
interface PromptBlock {
  content: string;
  tableCount: number;
  columnCount: number;
  generatedAt: string;
}
```

---
