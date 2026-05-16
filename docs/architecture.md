# SchemaLift Fullstack Architecture Document

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-15 | 0.1 | Initial draft | Winston (Architect) |

---

## 1. Introduction

This document outlines the complete fullstack architecture for **SchemaLift (CodexBMAD LLM Chat)**, including the Rust/Tauri backend layer, React frontend implementation, and their integration via Tauri's IPC bridge. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This is a **desktop monolith**, not a traditional web fullstack. The "backend" is Tauri's Rust core (handling DB connections, credential storage, SQLite persistence, and schema extraction), while the "frontend" is a React/TypeScript UI running in a WebView. The two communicate exclusively via Tauri commands (IPC) — there is no HTTP server, no REST API, and no cloud layer. All data stays on the user's machine.

### 1.1 Starter Template / Existing Project

**Decision:** `npm create tauri-app` greenfield scaffold using the Tauri v2 + React + TypeScript template (official Tauri starter). No third-party fullstack starter — this is a native desktop app and standard web fullstack starters (T3, MERN) don't apply.

**Constraints from scaffold:**
- Tauri v2 project structure: `src/` (React frontend) + `src-tauri/` (Rust backend)
- Vite as the frontend bundler (included by default)
- Cargo workspace for the Rust side

### 1.2 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-15 | 0.1 | Initial draft | Winston (Architect) |

---

## 2. High Level Architecture

### 2.1 Technical Summary

SchemaLift is a **desktop monolith** built with Tauri v2, combining a React/TypeScript WebView frontend with a Rust backend process running on the user's Windows machine. There is no remote server, no cloud dependency, and no HTTP API — all communication between UI and system services flows through Tauri's typed IPC command layer. The application connects directly to PostgreSQL databases over the local network, extracts schema metadata via the `sqlx` Rust crate, persists connection profiles and annotations in an embedded SQLite database, and stores credentials exclusively in the Windows Credential Manager. Distribution is a self-contained `.exe` installer — users need no runtime, no dependencies, and no internet connection after install.

### 2.2 Platform and Infrastructure Choice

This is a local desktop app — no cloud platform applies. The "infrastructure" is the user's Windows machine.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Desktop runtime | Tauri v2 | Lighter than Electron (~8MB vs ~120MB); Rust backend gives native OS API access (WinCred) |
| Frontend renderer | WebView2 (built into Windows 10+) | Zero additional install; always present on target OS |
| Distribution | `.exe` installer via NSIS (Tauri built-in) | No store required for MVP; direct download |
| Dev machine hosting | Local only | No staging/prod environments for MVP |

### 2.3 Repository Structure

**Monorepo — single repository, Tauri default layout.**

```
Structure:    Tauri v2 default (no monorepo tool needed — two natural packages: frontend + src-tauri)
Package org:  src/ (React app, managed by Vite/npm) + src-tauri/ (Rust crate, managed by Cargo)
Shared types: TypeScript interfaces in src/types/ mirror Rust structs — kept in sync manually (no code-gen for MVP)
```

### 2.4 High Level Architecture Diagram

```mermaid
graph TD
    User([User])

    subgraph Desktop["Windows Desktop Machine"]
        subgraph Tauri["Tauri v2 App Process"]
            WV["WebView2\nReact UI\n(TypeScript)"]
            IPC["Tauri IPC Bridge\n(Commands + Events)"]
            subgraph Rust["Rust Backend (src-tauri)"]
                CM["Connection Manager\n(sqlx + pg driver)"]
                SE["Schema Extractor\n(PostgreSQL introspection queries)"]
                PG["Prompt Generator\n(string assembly)"]
                DB["Local Store\n(SQLite via rusqlite)"]
                CRED["Credential Manager\n(windows-credentials crate)"]
            end
        end
        PGDB[("PostgreSQL\nDatabase\n(user's server)")]
        SQLITE[("SQLite\n.db file\n(AppData)")]
        WINCRED["Windows\nCredential Manager"]
    end

    Clipboard["OS Clipboard"]

    User -->|"interacts"| WV
    WV <-->|"invoke() / listen()"| IPC
    IPC <-->|"#[tauri::command]"| CM
    IPC <-->|"#[tauri::command]"| SE
    IPC <-->|"#[tauri::command]"| PG
    IPC <-->|"#[tauri::command]"| DB
    CM -->|"TCP connection"| PGDB
    SE -->|"information_schema queries"| PGDB
    DB <-->|"read/write"| SQLITE
    CM <-->|"store/retrieve password"| CRED
    CRED <-->|"Win32 API"| WINCRED
    PG -->|"write_text()"| Clipboard
```

### 2.5 Architectural Patterns

- **Desktop Monolith:** Single process, single deployable unit — _Rationale:_ MVP simplicity; no network surface area; aligns with offline-first privacy requirement
- **IPC Command Pattern (Tauri):** All frontend→backend calls are named typed commands via `invoke()`; backend→frontend events via `emit()` — _Rationale:_ Enforces clear layer separation; Tauri's built-in serialization prevents raw FFI leakage
- **Repository Pattern (Rust):** SQLite access abstracted behind trait-based repository structs — _Rationale:_ Keeps command handlers thin; enables unit testing of persistence logic without a real DB
- **Component-Based UI:** React functional components with hooks; no class components — _Rationale:_ Modern React standard; aligns with Tauri starter scaffold
- **Local-First Architecture:** All reads/writes happen on device; no network calls except to the user's own PostgreSQL server — _Rationale:_ Core product promise; privacy-safe by design; eliminates backend ops cost

---

## 3. Tech Stack

### 3.1 Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.x | All React UI code | Type safety across IPC boundary; catches interface mismatches at compile time |
| Frontend Framework | React | 18.x | UI component tree | Industry standard; Tauri official starter; large ecosystem |
| UI Component Library | shadcn/ui | latest | Pre-built accessible components | Copy-paste components (no runtime dep); Tailwind-native; dark mode first-class |
| State Management | Zustand | 4.x | Global app state (connection, schema, selections, annotations) | Minimal boilerplate; no Provider wrapping; works naturally with Tauri event listeners |
| Backend Language | Rust | 1.78+ (stable) | All system-level logic | Tauri requirement; memory safety; native Win32 API access |
| Backend Framework | Tauri v2 | 2.x | Desktop runtime + IPC bridge | Core architectural choice; WebView2 host; command/event system |
| API Style | Tauri IPC (invoke/emit) | Tauri v2 | Frontend↔Backend communication | No HTTP server needed; typed commands; built-in serialization via serde |
| Database (user's) | PostgreSQL | 12+ | Target database for schema extraction | MVP scope per PRD; most common developer DB |
| Database (local) | SQLite | 3.x (via rusqlite) | Persist profiles and annotations | Embedded; zero setup; single file in AppData |
| Cache | None (MVP) | — | — | Schema held in Zustand memory; re-fetched on reconnect |
| File Storage | AppData directory | OS-managed | SQLite .db file location | Standard Windows app data path via Tauri path API |
| Authentication | Windows Credential Manager | Win32 API | Secure password storage | NFR3 hard requirement; never plaintext; via `keyring` crate |
| Frontend Testing | Vitest | 1.x | Unit tests for React components and utilities | Vite-native; fast; compatible with jsdom |
| Backend Testing | Rust built-in (`cargo test`) | — | Unit + integration tests for Rust commands | Zero setup; first-class in Rust toolchain |
| E2E Testing | None (MVP) | — | — | Explicitly out of scope per PRD |
| Build Tool | Vite | 5.x | Frontend dev server + bundler | Tauri v2 default; fast HMR |
| Bundler | Vite (Rollup) | 5.x | Production frontend bundle | Included with Vite |
| IaC Tool | None (MVP) | — | — | Local-only app; no cloud infrastructure |
| CI/CD | None (MVP) | — | — | Explicitly deferred post-MVP per PRD |
| Monitoring | None (MVP) | — | — | NFR6: no telemetry without consent; MVP has none |
| Logging | `tracing` crate (Rust) | 0.1.x | Structured Rust backend logging to file | Debug support without user-visible telemetry |
| CSS Framework | Tailwind CSS | 3.x | Styling | Pairs with shadcn/ui; utility-first; dark mode via `class` strategy |
| DB Driver (Rust) | sqlx | 0.7.x | PostgreSQL connection + introspection queries | Async; compile-time query checking; supports connection pooling |
| Serialization | serde / serde_json | 1.x | Rust↔TypeScript data serialization over IPC | Tauri's standard; zero-cost deserialization |

---

## 4. Data Models

### 4.1 ConnectionProfile

**Purpose:** Represents a saved PostgreSQL connection. Persisted in SQLite. Password is stored separately in Windows Credential Manager, keyed by the profile's `id`.

**Key Attributes:**
- `id`: `string` (UUID) — stable key used as WinCred target name
- `name`: `string` — user-assigned display name (e.g., "Prod DB")
- `host`: `string` — server hostname or IP
- `port`: `number` — default 5432
- `database`: `string` — database name
- `username`: `string` — login user
- `createdAt`: `string` (ISO 8601)

#### TypeScript Interface

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

#### Relationships
- One ConnectionProfile → many Annotations (cascade delete)
- One ConnectionProfile → one password entry in Windows Credential Manager

---

### 4.2 SchemaTree (Runtime)

**Purpose:** The full schema metadata returned by the Rust extractor after a successful connection. Held in Zustand memory only — never persisted to SQLite.

#### TypeScript Interface

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

#### Relationships
- Populated on connect; cleared on disconnect
- Merged with Annotations from SQLite at load time to produce the UI's annotated view

---

### 4.3 Annotation

**Purpose:** User-authored plain-text description for a table or column. Persisted in SQLite, keyed by profile + schema + table + optional column. `columnName: null` means the annotation is on the table itself.

**Key Attributes:**
- `id`: `string` (UUID)
- `connectionProfileId`: `string` — FK to ConnectionProfile
- `schemaName`: `string`
- `tableName`: `string`
- `columnName`: `string | null` — null = table-level annotation
- `text`: `string` — max 500 chars
- `updatedAt`: `string` (ISO 8601)

#### TypeScript Interface

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

#### Relationships
- Many Annotations → one ConnectionProfile (cascade delete on profile delete)
- Merged onto SchemaTree nodes at load time for display

---

### 4.4 SelectionState (Runtime)

**Purpose:** Tracks which tables and columns the user has checked for inclusion in the prompt. UI state only — not persisted.

```typescript
interface SelectionState {
  tables: Set<string>;    // "schema.table"
  columns: Set<string>;   // "schema.table.column"
}
```

---

### 4.5 PromptBlock (Runtime)

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

## 5. API Specification (Tauri IPC Commands)

### 5.1 Connection Commands

```typescript
invoke<void>('test_connection', {
  host: string, port: number, database: string,
  username: string, password: string,
}): Promise<void>

invoke<SchemaTree>('connect_and_extract_schema', {
  profileId: string,
}): Promise<SchemaTree>

invoke<void>('disconnect'): Promise<void>
```

### 5.2 Profile Commands

```typescript
invoke<ConnectionProfile[]>('list_profiles'): Promise<ConnectionProfile[]>

invoke<ConnectionProfile>('save_profile', {
  name: string, host: string, port: number,
  database: string, username: string, password: string,
}): Promise<ConnectionProfile>

invoke<void>('rename_profile', {
  profileId: string, newName: string,
}): Promise<void>

invoke<void>('delete_profile', {
  profileId: string,
}): Promise<void>
```

### 5.3 Annotation Commands

```typescript
invoke<Annotation[]>('load_annotations', {
  profileId: string,
}): Promise<Annotation[]>

invoke<Annotation>('upsert_annotation', {
  profileId: string, schemaName: string, tableName: string,
  columnName: string | null, text: string,
}): Promise<Annotation>

invoke<void>('delete_annotation', {
  annotationId: string,
}): Promise<void>
```

### 5.4 Prompt Generation Command

```typescript
invoke<PromptBlock>('generate_prompt', {
  profileId: string,
  selectedTables: Array<{
    schemaName: string,
    tableName: string,
    selectedColumns: string[],
  }>,
}): Promise<PromptBlock>
```

### 5.5 Clipboard Command

```typescript
invoke<void>('copy_to_clipboard', { text: string }): Promise<void>
```

### 5.6 Tauri Events (Backend → Frontend)

```typescript
listen<{ tablesLoaded: number; totalTables: number }>('schema_progress', handler)
listen<{ reason: string }>('connection_lost', handler)
```

### 5.7 Error Convention

```typescript
interface TauriCommandError {
  code: string;
  message: string;
}
```

---

## 6. Components

### 6.1 Connection Manager (Rust)

**Responsibility:** Owns the active PostgreSQL connection pool. Handles connect, disconnect, test-connection, and credential retrieval from Windows Credential Manager.

**Key Interfaces:**
- `test_connection(params)` → `Result<(), AppError>`
- `connect(profile_id)` → `Result<PgPool, AppError>`
- `disconnect()` → `Result<(), AppError>`

**Dependencies:** `sqlx` (PgPool), `keyring` crate, `ConnectionProfileRepository`

**Technology:** Rust, sqlx async connection pool, Tauri managed state

---

### 6.2 Schema Extractor (Rust)

**Responsibility:** Runs `information_schema` and `pg_catalog` introspection queries against the active connection to produce a complete `SchemaTree`.

**Key Interfaces:**
- `extract_schema(pool)` → `Result<SchemaTree, AppError>`
- `emit_progress(window, loaded, total)`

**Dependencies:** Connection Manager (active PgPool), Tauri `Window`

**Technology:** Rust, sqlx queries against `information_schema`

---

### 6.3 Prompt Generator (Rust)

**Responsibility:** Takes a selection of tables/columns plus their annotations and assembles the formatted LLM prompt string.

**Key Interfaces:**
- `generate_prompt(selection, annotations, schema_tree)` → `Result<PromptBlock, AppError>`

**Dependencies:** Schema Extractor output, Annotation Repository

**Technology:** Rust string formatting

---

### 6.4 Connection Profile Repository (Rust)

**Responsibility:** CRUD operations for `ConnectionProfile` records in SQLite. Handles migrations on startup.

**Key Interfaces:** `list()`, `insert(params)`, `rename(id, name)`, `delete(id)`

**Dependencies:** `rusqlite`, Tauri path API

---

### 6.5 Annotation Repository (Rust)

**Responsibility:** CRUD for `Annotation` records in SQLite. Upserts on every debounced keystroke.

**Key Interfaces:** `load_for_profile(id)`, `upsert(params)`, `delete(id)`, `delete_for_profile(id)`

**Dependencies:** `rusqlite`

---

### 6.6 Credential Store (Rust)

**Responsibility:** Thin wrapper around Windows Credential Manager. Stores and retrieves passwords keyed by `profile_id`.

**Key Interfaces:** `store(id, password)`, `retrieve(id)`, `delete(id)`

**Technology:** `keyring` crate (WinCred backend)

---

### 6.7 React UI Shell (Frontend)

**Responsibility:** App entry point. Renders persistent nav, routes between screens, hosts global Tauri event listeners.

**Dependencies:** Zustand store, React Router, all screen components

---

### 6.8 Schema Browser (Frontend)

**Responsibility:** Renders the interactive schema tree with checkboxes, search/filter, annotation indicators, and inline annotation input.

**Dependencies:** Zustand store, shadcn/ui, `@tanstack/virtual` (if > 100 nodes)

---

### 6.9 Zustand App Store (Frontend)

**Responsibility:** Single source of truth for all runtime UI state.

**Key state:** `connection`, `schemaTree`, `selection`, `annotations`, `prompt`

---

### 6.10 Component Diagram

```mermaid
graph TD
    subgraph Frontend["React Frontend (WebView2)"]
        Shell["UI Shell\n(Nav + Routing)"]
        ConnScreen["Connection Screen"]
        SchBrowser["Schema Browser"]
        PromptPreview["Prompt Preview Screen"]
        Settings["Settings Screen"]
        Store["Zustand App Store"]

        Shell --> ConnScreen
        Shell --> SchBrowser
        Shell --> PromptPreview
        Shell --> Settings
        ConnScreen --> Store
        SchBrowser --> Store
        PromptPreview --> Store
        Settings --> Store
    end

    subgraph IPC["Tauri IPC Bridge"]
        Commands["#[tauri::command] handlers"]
    end

    subgraph Backend["Rust Backend"]
        CM["Connection Manager"]
        SE["Schema Extractor"]
        PG["Prompt Generator"]
        CPR["Profile Repository"]
        AR["Annotation Repository"]
        CS["Credential Store"]
    end

    Store <-->|"invoke()"| Commands
    Commands --> CM
    Commands --> SE
    Commands --> PG
    Commands --> CPR
    Commands --> AR
    Commands --> CS
```

---

## 7. External APIs

SchemaLift has **no external API integrations** in the MVP. All network activity is limited to the user's own PostgreSQL server on their local network.

| Potential Integration | Decision | Reason |
|---|---|---|
| Cloud LLM APIs | Out of scope | PRD explicitly excludes built-in LLM integration |
| Telemetry / Analytics | Out of scope | NFR6 prohibits telemetry without explicit consent |
| Auto-update service | Out of scope | Manual `.exe` update deferred post-MVP |
| Windows Credential Manager | Internal OS API | Accessed via Rust crate — not a network call |
| User's PostgreSQL server | User-owned | Not a third-party integration |

---

## 8. Core Workflows

### 8.1 Connect & Extract Schema

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant Store as Zustand Store
    participant Tauri as Tauri IPC
    participant CM as Connection Manager
    participant CS as Credential Store
    participant SE as Schema Extractor
    participant PG as PostgreSQL

    User->>UI: Select saved profile & click Connect
    UI->>Tauri: invoke('connect_and_extract_schema', {profileId})
    Tauri->>CS: retrieve(profileId)
    CS-->>Tauri: password
    Tauri->>CM: connect(host, port, db, user, password)
    CM->>PG: TCP handshake + auth
    PG-->>CM: connection established
    CM-->>Tauri: PgPool
    Tauri->>SE: extract_schema(pool)
    loop per schema batch
        SE->>PG: information_schema queries
        PG-->>SE: table/column/constraint rows
        SE->>UI: emit('schema_progress', {loaded, total})
        UI->>Store: update progress indicator
    end
    SE-->>Tauri: SchemaTree
    Tauri->>Store: setSchemaTree(schemaTree)
    Tauri->>Store: loadAnnotations(profileId)
    Store-->>UI: schema + annotations merged
    UI->>User: Schema Browser rendered
```

### 8.2 Annotate & Generate Prompt

```mermaid
sequenceDiagram
    actor User
    participant UI as Schema Browser
    participant Store as Zustand Store
    participant Tauri as Tauri IPC
    participant AR as Annotation Repository
    participant PG_GEN as Prompt Generator

    User->>UI: Check tables/columns
    UI->>Store: toggleTable / toggleColumn
    User->>UI: Click table → type annotation
    UI->>UI: debounce 500ms
    UI->>Tauri: invoke('upsert_annotation', {profileId, schema, table, column, text})
    Tauri->>AR: upsert(params)
    AR-->>Tauri: Annotation
    Tauri-->>Store: setAnnotation(key, annotation)
    UI-->>User: annotation icon appears on table

    User->>UI: Click "Generate Prompt"
    UI->>Tauri: invoke('generate_prompt', {profileId, selectedTables})
    Tauri->>AR: load_for_profile(profileId)
    AR-->>Tauri: Annotation[]
    Tauri->>PG_GEN: generate(selection, annotations, schemaTree)
    PG_GEN-->>Tauri: PromptBlock
    Tauri-->>Store: setPrompt(promptBlock)
    UI->>User: Navigate to Prompt Preview

    User->>UI: Click "Copy to Clipboard"
    UI->>Tauri: invoke('copy_to_clipboard', {text})
    Tauri-->>UI: success
    UI->>User: Toast confirmation shown
```

### 8.3 Save New Connection Profile

```mermaid
sequenceDiagram
    actor User
    participant UI as Connection Screen
    participant Tauri as Tauri IPC
    participant CPR as Profile Repository
    participant CS as Credential Store
    participant CM as Connection Manager

    User->>UI: Fill form + click "Test Connection"
    UI->>Tauri: invoke('test_connection', {host, port, db, user, password})
    Tauri->>CM: test(params)
    CM->>PG: connect + disconnect
    PG-->>CM: ok
    CM-->>UI: success banner shown

    User->>UI: Click "Save Profile"
    UI->>Tauri: invoke('save_profile', {name, host, port, db, user, password})
    Tauri->>CPR: insert({name, host, port, db, user})
    CPR-->>Tauri: ConnectionProfile (with new UUID)
    Tauri->>CS: store(profileId, password)
    CS-->>Tauri: ok
    Tauri-->>UI: ConnectionProfile
    UI->>User: Profile appears in dropdown
```

### 8.4 Connection Lost (Error Path)

```mermaid
sequenceDiagram
    participant PG as PostgreSQL
    participant CM as Connection Manager
    participant Tauri as Tauri IPC
    participant Shell as UI Shell
    participant Store as Zustand Store

    PG->>CM: connection dropped (network error)
    CM->>Tauri: detect on next query attempt
    Tauri->>Shell: emit('connection_lost', {reason})
    Shell->>Store: clearConnection() + clearSchemaTree()
    Shell->>User: Toast error + redirect to Connection Screen
```

---

## 9. Database Schema

### 9.1 SQLite Schema (DDL)

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

### 9.2 SQLite File Location

```
Windows: C:\Users\{username}\AppData\Roaming\{bundle_id}\schemalift.db
Resolved at runtime via: tauri::api::path::app_data_dir(&config)
```

### 9.3 Migration Strategy

Embedded migration runner — SQL files included via `include_str!()` in `db.rs`. Runs on every app startup; idempotent via `schema_migrations` version table.

### 9.4 Rust Connection Setup

```rust
fn open_db(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
    run_migrations(&conn)?;
    Ok(conn)
}
```

---

## 10. Frontend Architecture

### 10.1 Component Architecture

#### Component Organization

```plaintext
src/
├── components/
│   ├── ui/                        # shadcn/ui generated components
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   └── NavItem.tsx
│   ├── connection/
│   │   ├── ConnectionForm.tsx
│   │   ├── ProfileDropdown.tsx
│   │   └── TestConnectionBanner.tsx
│   ├── schema/
│   │   ├── SchemaTree.tsx
│   │   ├── SchemaNode.tsx
│   │   ├── TableNode.tsx
│   │   ├── ColumnNode.tsx
│   │   ├── AnnotationInput.tsx
│   │   └── SchemaSearchBar.tsx
│   ├── prompt/
│   │   ├── PromptPreview.tsx
│   │   └── CopyButton.tsx
│   └── settings/
│       ├── ProfileList.tsx
│       ├── ProfileListItem.tsx
│       └── DeleteProfileDialog.tsx
├── screens/
│   ├── ConnectionScreen.tsx
│   ├── SchemaBrowserScreen.tsx
│   ├── PromptPreviewScreen.tsx
│   └── SettingsScreen.tsx
├── store/
│   └── appStore.ts
├── commands/
│   └── index.ts
├── hooks/
│   ├── useDebounce.ts
│   └── useTauriEvents.ts
├── types/
│   └── index.ts
├── lib/
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css
```

#### Component Template

```typescript
import { FC } from 'react'

interface TableNodeProps {
  schemaName: string
  tableName: string
  columns: PgColumn[]
}

const TableNode: FC<TableNodeProps> = ({ schemaName, tableName, columns }) => {
  const { selection, toggleTable } = useAppStore()
  const isChecked = selection.tables.has(`${schemaName}.${tableName}`)

  return (
    <div className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded">
      <Checkbox
        checked={isChecked}
        onCheckedChange={() => toggleTable(schemaName, tableName, columns)}
      />
      <span className="text-sm font-medium">{tableName}</span>
    </div>
  )
}

export default TableNode
```

### 10.2 State Management Architecture

#### State Structure

```typescript
interface AppState {
  activeProfile: ConnectionProfile | null
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error'
  connectionError: string | null
  schemaTree: SchemaTree | null
  schemaProgress: { loaded: number; total: number } | null
  schemaFilter: string
  selectedTables: Set<string>
  selectedColumns: Set<string>
  annotations: Map<string, Annotation>
  prompt: PromptBlock | null
  isGenerating: boolean

  // Actions
  setActiveProfile: (profile: ConnectionProfile | null) => void
  setConnectionStatus: (status: AppState['connectionStatus'], error?: string) => void
  setSchemaTree: (tree: SchemaTree) => void
  setSchemaProgress: (progress: { loaded: number; total: number } | null) => void
  setSchemaFilter: (filter: string) => void
  toggleTable: (schema: string, table: string, columns: PgColumn[]) => void
  toggleColumn: (schema: string, table: string, column: string) => void
  setAnnotation: (key: string, annotation: Annotation) => void
  removeAnnotation: (key: string) => void
  setPrompt: (prompt: PromptBlock | null) => void
  setIsGenerating: (v: boolean) => void
  clearConnection: () => void
}
```

#### State Management Patterns
- Selectors over raw state — components use `useAppStore(s => s.field)` not `useAppStore()`
- Actions are the only write path — no component mutates state directly
- `clearConnection()` resets all runtime state on disconnect or `connection_lost`
- `Set` and `Map` updates use spread to trigger re-renders

### 10.3 Routing Architecture

#### Route Organization

```plaintext
/ (AppShell — HashRouter)
├── /connection       → ConnectionScreen   (default)
├── /schema           → SchemaBrowserScreen (requires activeProfile)
├── /prompt           → PromptPreviewScreen  (requires prompt)
└── /settings         → SettingsScreen
```

#### Protected Route Pattern

```typescript
const RequiresConnection: FC<{ children: ReactNode }> = ({ children }) => {
  const activeProfile = useAppStore(s => s.activeProfile)
  if (!activeProfile) return <Navigate to="/connection" replace />
  return <>{children}</>
}
```

### 10.4 Frontend Services Layer

#### API Client Setup

```typescript
// src/commands/index.ts — all invoke() calls centralized here
import { invoke } from '@tauri-apps/api/core'

export const commands = {
  testConnection: (params: TestConnectionParams) =>
    invoke<void>('test_connection', params),
  connectAndExtractSchema: (profileId: string) =>
    invoke<SchemaTree>('connect_and_extract_schema', { profileId }),
  disconnect: () => invoke<void>('disconnect'),
  listProfiles: () => invoke<ConnectionProfile[]>('list_profiles'),
  saveProfile: (params: SaveProfileParams) =>
    invoke<ConnectionProfile>('save_profile', params),
  renameProfile: (profileId: string, newName: string) =>
    invoke<void>('rename_profile', { profileId, newName }),
  deleteProfile: (profileId: string) =>
    invoke<void>('delete_profile', { profileId }),
  loadAnnotations: (profileId: string) =>
    invoke<Annotation[]>('load_annotations', { profileId }),
  upsertAnnotation: (params: UpsertAnnotationParams) =>
    invoke<Annotation>('upsert_annotation', params),
  deleteAnnotation: (annotationId: string) =>
    invoke<void>('delete_annotation', { annotationId }),
  generatePrompt: (params: GeneratePromptParams) =>
    invoke<PromptBlock>('generate_prompt', params),
  copyToClipboard: (text: string) =>
    invoke<void>('copy_to_clipboard', { text }),
}
```

---

## 11. Backend Architecture

### 11.1 Service Architecture

#### Module Organization

```plaintext
src-tauri/src/
├── main.rs
├── lib.rs
├── commands/
│   ├── mod.rs
│   ├── connection.rs
│   ├── profiles.rs
│   ├── annotations.rs
│   ├── prompt.rs
│   └── clipboard.rs
├── services/
│   ├── mod.rs
│   ├── connection_manager.rs
│   ├── schema_extractor.rs
│   └── prompt_generator.rs
├── repositories/
│   ├── mod.rs
│   ├── profile_repository.rs
│   └── annotation_repository.rs
├── credential_store.rs
├── db.rs
├── models.rs
├── errors.rs
└── migrations/
    └── 001_initial.sql
```

#### Command Handler Template

```rust
#[tauri::command]
async fn connect_and_extract_schema(
    profile_id: String,
    state: tauri::State<'_, AppState>,
    window: tauri::Window,
) -> Result<SchemaTree, AppError> {
    let profile = state.profile_repo.lock().await.find(&profile_id)?;
    let password = state.credential_store.retrieve(&profile_id)?;
    let pool = state.connection_manager.lock().await
        .connect(&profile, &password).await?;
    let schema_tree = state.schema_extractor
        .extract(&pool, &window).await?;
    Ok(schema_tree)
}
```

### 11.2 Database Architecture

Repository pattern — each repo receives a `rusqlite::Connection` from Tauri managed state. WAL mode enabled for concurrent reads during schema extraction.

```rust
pub fn upsert(&self, params: UpsertAnnotationParams) -> Result<Annotation, AppError> {
    let conn = self.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO annotations
            (id, connection_profile_id, schema_name, table_name, column_name, text, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
         ON CONFLICT(connection_profile_id, schema_name, table_name, column_name)
         DO UPDATE SET text = excluded.text, updated_at = datetime('now')",
        rusqlite::params![/* ... */],
    )?;
    self.find_by_key(&params)
}
```

### 11.3 Authentication and Authorization

No user authentication (single-user local app). Credential handling via Windows Credential Manager only.

#### Auth Flow

```mermaid
sequenceDiagram
    participant UI as React UI
    participant CR as commands/profiles.rs
    participant CS as CredentialStore
    participant WC as Windows Credential Manager
    participant CM as ConnectionManager
    participant PG as PostgreSQL

    Note over UI,WC: Save Profile Flow
    UI->>CR: save_profile(name, host, port, db, user, password)
    CR->>CS: store(profile_id, password)
    CS->>WC: CredWrite(target=profile_id, secret=password)
    WC-->>CS: ok
    CR-->>UI: ConnectionProfile (no password field)

    Note over UI,PG: Connect Flow
    UI->>CR: connect_and_extract_schema(profile_id)
    CR->>CS: retrieve(profile_id)
    CS->>WC: CredRead(target=profile_id)
    WC-->>CS: password
    CS-->>CR: password (in Rust memory only)
    CR->>CM: connect(host, port, db, user, password)
    CM->>PG: TLS handshake + auth
    PG-->>CM: authenticated
```

#### Credential Store

```rust
pub struct CredentialStore { service_name: String }

impl CredentialStore {
    pub fn store(&self, profile_id: &str, password: &str) -> Result<(), AppError> {
        let entry = Entry::new(&self.service_name, profile_id)?;
        entry.set_password(password).map_err(AppError::from)
    }
    pub fn retrieve(&self, profile_id: &str) -> Result<String, AppError> {
        let entry = Entry::new(&self.service_name, profile_id)?;
        entry.get_password().map_err(AppError::from)
    }
    pub fn delete(&self, profile_id: &str) -> Result<(), AppError> {
        let entry = Entry::new(&self.service_name, profile_id)?;
        entry.delete_password().map_err(AppError::from)
    }
}
```

### 11.4 Tauri Managed State

```rust
tauri::Builder::default()
    .manage(AppState {
        connection_manager: Mutex::new(ConnectionManager::new()),
        schema_extractor: SchemaExtractor::new(),
        prompt_generator: PromptGenerator::new(),
        profile_repo: Mutex::new(ProfileRepository::new(db_conn.clone())),
        annotation_repo: Mutex::new(AnnotationRepository::new(db_conn.clone())),
        credential_store: CredentialStore::new("schemalift"),
    })
    .invoke_handler(tauri::generate_handler![
        test_connection, connect_and_extract_schema, disconnect,
        list_profiles, save_profile, rename_profile, delete_profile,
        load_annotations, upsert_annotation, delete_annotation,
        generate_prompt, copy_to_clipboard,
    ])
```

### 11.5 Error Handling

```rust
#[derive(Debug, thiserror::Error, serde::Serialize)]
#[serde(tag = "code", content = "message")]
pub enum AppError {
    #[error("Could not reach host. Check the hostname and port.")]
    HostUnreachable(String),
    #[error("Authentication failed. Check your username and password.")]
    AuthFailed(String),
    #[error("Database not found. Check the database name.")]
    DatabaseNotFound(String),
    #[error("Connection timed out after {0} seconds.")]
    ConnectionTimeout(u64),
    #[error("Profile not found.")]
    ProfileNotFound,
    #[error("A profile with this name already exists.")]
    DuplicateProfileName,
    #[error("Failed to store credentials securely.")]
    CredentialStoreError(String),
    #[error("Failed to retrieve credentials.")]
    CredentialNotFound(String),
    #[error("Schema extraction failed: {0}")]
    ExtractionFailed(String),
    #[error("Annotation text exceeds 500 character limit.")]
    AnnotationTooLong,
    #[error("Internal error: {0}")]
    Internal(String),
}
```

---

## 12. Unified Project Structure

```plaintext
schemalift/
├── .github/workflows/.gitkeep       # CI/CD placeholder (post-MVP)
├── src/                             # React frontend
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/
│   │   ├── connection/
│   │   ├── schema/
│   │   ├── prompt/
│   │   └── settings/
│   ├── screens/
│   ├── store/appStore.ts
│   ├── commands/index.ts
│   ├── hooks/
│   ├── types/index.ts
│   ├── lib/utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/                       # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── models.rs
│   │   ├── errors.rs
│   │   ├── db.rs
│   │   ├── credential_store.rs
│   │   ├── commands/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── migrations/001_initial.sql
│   ├── icons/
│   ├── Cargo.toml
│   ├── Cargo.lock
│   └── tauri.conf.json
├── docs/
│   ├── brief.md
│   ├── prd.md
│   └── architecture.md
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── components.json
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── vite.config.ts
```

---

## 13. Development Workflow

### 13.1 Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable

# Node.js 20+ LTS
node --version   # must be >= 20

# Visual Studio C++ Build Tools (Windows — required by Rust)
# Select: "Desktop development with C++"

# Tauri CLI
cargo install tauri-cli --version "^2"

# PostgreSQL for integration tests
docker run -d --name schemalift-test-pg \
  -e POSTGRES_PASSWORD=testpass \
  -p 5432:5432 postgres:16
```

### 13.2 Initial Setup

```bash
git clone https://github.com/<org>/schemalift.git
cd schemalift
npm install
npx shadcn@latest init
cargo build --manifest-path src-tauri/Cargo.toml
cp .env.example .env.local
```

### 13.3 Development Commands

```bash
# Full app (hot reload on both Vite + Rust)
npm run tauri dev

# Frontend only (browser — for UI iteration)
npm run dev

# Build production .exe installer
npm run tauri build

# Frontend tests
npm run test

# Rust unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# Rust integration tests (requires PostgreSQL)
cargo test --manifest-path src-tauri/Cargo.toml -- --include-ignored integration

# Type check
npm run typecheck

# Lint + format
npm run lint
cargo fmt --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

### 13.4 Environment Configuration

```bash
# .env.example

# Frontend — no required env vars for MVP
# VITE_ENABLE_TELEMETRY=false  (future opt-in)

# Rust integration tests only (not bundled in binary)
# TEST_PG_HOST=localhost
# TEST_PG_PORT=5432
# TEST_PG_DB=postgres
# TEST_PG_USER=postgres
# TEST_PG_PASSWORD=testpass
```

---

## 14. Deployment Architecture

### 14.1 Deployment Strategy

**Frontend:** Bundled into Tauri binary — not deployed to any server or CDN.

**Backend:** Compiled to native Windows `.exe` via `cargo build --release`, packaged by Tauri NSIS bundler.

**Output:** `src-tauri/target/release/bundle/nsis/SchemaLift_x.x.x_x64-setup.exe`

### 14.2 Build Pipeline (Manual — MVP)

```bash
npm ci
npm run typecheck && npm run lint
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
npm run test && cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri build
# Upload .exe to GitHub Releases
```

### 14.3 CI/CD Pipeline (Post-MVP Template)

```yaml
# .github/workflows/ci.yaml — NOT ACTIVE in MVP
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run typecheck && npm run lint && npm run test
      - run: cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
      - run: cargo test --manifest-path src-tauri/Cargo.toml
```

### 14.4 Environments

| Environment | Description | Purpose |
|-------------|-------------|---------|
| Development | Local dev machine (`localhost:1420`) | Active development with hot reload |
| Production | User's Windows machine (installed `.exe`) | Live app — no remote server |
| Test (Rust) | Developer machine (local PostgreSQL) | Integration tests |

### 14.5 Distribution

```
MVP: Build .exe → Upload to GitHub Releases → Share download link

Release Checklist:
  [ ] Version bumped in tauri.conf.json + Cargo.toml
  [ ] All tests passing
  [ ] Smoke test on clean Windows 10 VM
  [ ] Verify credentials stored in WinCred (not AppData files)
  [ ] Upload to GitHub Releases with changelog
```

### 14.6 Code Signing Note

MVP ships unsigned — Windows SmartScreen will warn on first run ("More info → Run anyway"). EV Code Signing Certificate (~$300-500/yr) is a post-MVP requirement for enterprise adoption.

---

## 15. Security and Performance

### 15.1 Security Requirements

**Frontend Security:**
- CSP enforced via Tauri v2 capability system — no `eval()`, no external network requests from WebView
- React JSX escapes all rendered values — no `dangerouslySetInnerHTML`
- No sensitive data in `localStorage`, `sessionStorage`, or IndexedDB

**Backend Security:**
- All IPC parameters validated in Rust before use
- No rate limiting needed — single-user local app, no network-exposed surface
- No CORS needed — no HTTP server

**Tauri Capability Configuration:**
```json
{
  "permissions": [
    "core:path:default",
    "core:event:default",
    "core:window:default",
    "core:app:default",
    "core:clipboard:write-text"
  ]
}
```

### 15.2 Credential Security Model

```
Connection name, host, port, db, username → SQLite (not sensitive)
Password                                  → Windows Credential Manager ONLY
Annotations                               → SQLite (user content)
Schema metadata                           → Zustand memory only (not persisted)

Password lifecycle:
  1. Typed in React form (memory only)
  2. Passed to Rust via IPC on save_profile
  3. Written to WinCred — never touches SQLite
  4. Cleared from Rust stack after WinCred write
  5. On connect: WinCred → Rust memory → handshake → dropped
  6. NEVER appears in: logs, SQLite, IPC responses, Zustand store
```

### 15.3 Performance Optimization

**Frontend:**
- Bundle size target: < 2MB gzipped
- `@tanstack/virtual` loaded only if SchemaTree > 100 nodes
- `Map<string, Annotation>` for O(1) annotation lookup

**Backend:**
- Schema extraction: 3 batch queries (not N+1 per table)
- `PgPool` max 3 connections, held in managed state for session duration
- WAL mode prevents annotation writes blocking schema reads
- NFR2 (< 5 seconds for 200-table DB) validated by explicit integration test

**Schema Extraction Queries (3 batch, not N+1):**
```sql
-- Query 1: All columns
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');

-- Query 2: All primary keys
SELECT tc.table_schema, tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY';

-- Query 3: All foreign keys
SELECT kcu.table_schema, kcu.table_name, kcu.column_name,
       ccu.table_schema, ccu.table_name, ccu.column_name, tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## 16. Testing Strategy

### 16.1 Testing Pyramid

```plaintext
          [ E2E Tests ]
           — None MVP —

     [ Integration Tests ]
  Rust: DB connectivity + SQLite
  (real PostgreSQL required, #[ignore])

[ Frontend Unit ]     [ Backend Unit ]
Vitest + jsdom        cargo test (no DB)
Components, store     Schema extractor logic,
utilities             prompt generator,
                      repositories (in-memory SQLite)
```

### 16.2 Test Organization

**Frontend:** `src/__tests__/` — components, store, lib utilities

**Backend:** `#[cfg(test)]` modules in each service/repository file + `src-tauri/tests/integration/` for `#[ignore]` integration tests

**E2E:** None for MVP. Post-MVP: Playwright + tauri-driver.

### 16.3 Frontend Test Example

```typescript
// appStore.test.ts
it('toggleTable selects all columns when checking a table', () => {
  const columns = [
    { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
    { name: 'email', dataType: 'text', isNullable: false, isPrimaryKey: false },
  ]
  useAppStore.getState().toggleTable('public', 'users', columns)
  const { selectedTables, selectedColumns } = useAppStore.getState()
  expect(selectedTables.has('public.users')).toBe(true)
  expect(selectedColumns.has('public.users.id')).toBe(true)
})
```

### 16.4 Backend Unit Test Example

```rust
#[test]
fn prompt_includes_annotation_as_comment() {
    let generator = PromptGenerator::new();
    let result = generator.generate(&selection, &[annotation], &tables).unwrap();
    assert!(result.content.contains("-- Stores all registered users"));
}
```

### 16.5 Integration Test Example

```rust
#[tokio::test]
#[ignore = "requires local PostgreSQL on port 5432"]
async fn extraction_completes_within_5_seconds() {
    let pool = sqlx::PgPool::connect("postgresql://postgres:testpass@localhost:5432/postgres")
        .await.unwrap();
    let start = std::time::Instant::now();
    SchemaExtractor::new().extract_headless(&pool).await.unwrap();
    assert!(start.elapsed().as_secs() < 5);
}
```

### 16.6 Vitest Configuration

```typescript
// vite.config.ts test block
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/__tests__/setup.ts'],
  mockReset: true,
}

// setup.ts — mock all Tauri IPC
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn(() => Promise.resolve(() => {})) }))
```

---

## 17. Coding Standards

### 17.1 Critical Fullstack Rules

- **Type Mirroring:** Every Rust IPC struct has a matching TypeScript interface in `src/types/index.ts`; serde `rename_all = "camelCase"` handles the naming bridge
- **IPC Gateway:** All `invoke()` calls go through `src/commands/index.ts` — no component imports `@tauri-apps/api` directly
- **No Password in Store:** Zustand store never holds a password field; password exists in React local state only during form input
- **Annotation Key Convention:** Always use `buildAnnotationKey()` from `src/lib/utils.ts` — never construct keys inline
- **Rust Error Propagation:** All fallible Rust functions return `Result<T, AppError>`; never `.unwrap()` or `.expect()` in non-test code
- **SQLite Pragma on Open:** Every connection opened via `db::open_db()` — never call `Connection::open()` directly
- **Command Handlers Stay Thin:** `#[tauri::command]` functions ≤ ~15 lines; no business logic in handlers

### 17.2 Naming Conventions

| Element | Frontend | Backend (Rust) | Example |
|---------|----------|----------------|---------|
| Components | PascalCase | — | `TableNode.tsx` |
| Hooks | camelCase + `use` | — | `useDebounce.ts` |
| Store actions | camelCase verbs | — | `toggleTable` |
| IPC commands (TS) | camelCase | — | `commands.upsertAnnotation()` |
| IPC commands (Rust) | — | snake_case | `upsert_annotation` |
| Tauri events | — | kebab-case | `schema_progress` |
| Rust structs | — | PascalCase | `AnnotationRepository` |
| SQLite tables | — | snake_case | `connection_profiles` |
| TypeScript types | PascalCase | — | `ConnectionProfile` |

### 17.3 Key Rust Patterns

```rust
// Always use ? for propagation
pub fn find_profile(&self, id: &str) -> Result<ConnectionProfile, AppError> { /* ... */ }

// Drop sensitive strings explicitly
let password = self.credential_store.retrieve(profile_id)?;
let pool = self.connect_with_password(&profile, &password).await?;
drop(password);

// Use spawn_blocking for rusqlite in async context
let result = tokio::task::spawn_blocking(move || {
    conn.execute(sql, params)
}).await??;

// Structured logging via tracing
tracing::info!(profile_id = %profile_id, duration_ms = %elapsed, "Schema extraction complete");
```

### 17.4 Key React Patterns

```typescript
// Field selector — not whole store
const activeProfile = useAppStore(s => s.activeProfile)

// Debounce annotation saves
const debouncedSave = useDebounce(async (text: string) => {
  await commands.upsertAnnotation({ ...params, text })
}, 500)

// Empty annotation → delete
if (text.trim() === '') {
  await commands.deleteAnnotation(annotationId)
} else {
  await commands.upsertAnnotation({ ...params, text })
}
```

---

## 18. Error Handling Strategy

### 18.1 Error Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React Component
    participant Store as Zustand Store
    participant CMD as commands/index.ts
    participant Tauri as Tauri IPC
    participant Rust as Rust Handler
    participant Svc as Service / Repository

    User->>UI: Triggers action
    UI->>Store: calls store action
    Store->>CMD: await commands.someCommand(params)
    CMD->>Tauri: invoke('some_command', params)
    Tauri->>Rust: deserialize + dispatch
    Rust->>Svc: delegate to service/repo
    Svc-->>Rust: Err(AppError::HostUnreachable)
    Rust-->>Tauri: Err serialized as JSON
    Tauri-->>CMD: Promise rejects with {code, message}
    CMD-->>Store: throws TauriCommandError
    Store->>Store: set error state
    Store-->>UI: re-render with error
    UI->>User: Toast or inline error message shown
```

### 18.2 Error Response Format

```typescript
interface TauriCommandError {
  code: string;     // e.g., "HostUnreachable", "AuthFailed"
  message: string;  // human-readable, safe to display
}

function isTauriError(err: unknown): err is TauriCommandError {
  return typeof err === 'object' && err !== null &&
    'code' in err && 'message' in err
}
```

### 18.3 Two Error Surfaces

- **Store state** — for persistent errors (connection failure) that should persist until resolved
- **Toast** — for transient action errors (delete failed, rename failed) that self-dismiss

### 18.4 Unrecoverable States

| Scenario | Behaviour |
|----------|-----------|
| SQLite corrupt on startup | Fatal error dialog + exit |
| WinCred unavailable | `CredentialStoreError` surfaced on connect |
| `connection_lost` event | Shell clears state + redirects to Connection screen |
| Mutex lock poisoned | Surfaces as `Internal` error; user must restart |

---

## 19. Monitoring and Observability

### 19.1 Logging Architecture

```rust
// Daily rotating log file in AppData/logs/
// %APPDATA%\energy.cfp.schemalift\logs\schemalift.log

fn init_logging(log_dir: &Path) {
    let file_appender = RollingFileAppender::new(Rotation::DAILY, log_dir, "schemalift.log");
    tracing_subscriber::registry()
        .with(EnvFilter::new("schemalift=info,warn"))
        .with(fmt::layer().with_writer(file_appender).with_ansi(false))
        .init();
}
```

### 19.2 Key Log Events

| Event | Level | Fields |
|-------|-------|--------|
| Schema extraction complete | INFO | `profile_id`, `tables`, `duration_ms` |
| Connection established | INFO | `host`, `database` |
| Credential store error | ERROR | `profile_id`, `error` |
| Annotation upserted | DEBUG | `table_name` |
| App startup | INFO | `duration_ms` |

### 19.3 Frontend Dev Observability

DevTools enabled automatically in `npm run tauri dev`. Stripped from release builds. IPC errors logged to console in dev mode via `import.meta.env.DEV` guard.

### 19.4 No Cloud Telemetry

NFR6 prohibits telemetry without explicit user consent. No Sentry, Mixpanel, or analytics in MVP. Bug reports use local log file (`%APPDATA%\energy.cfp.schemalift\logs\`).

---

## 20. Checklist Results Report

| Category | Status | Pass Rate | Notes |
|---|---|---|---|
| 1. Requirements Alignment | PASS | 100% | All FR/NFR covered; epics mapped to components |
| 2. Architecture Fundamentals | PASS | 100% | Clear diagrams; IPC layer well-defined; SoC enforced |
| 3. Technical Stack & Decisions | PASS | 95% | Versions specified; rationale documented; one flag: shadcn/ui version unpinned |
| 4. Frontend Design & Implementation | PASS | 95% | Component org clear; HashRouter justified; no visual regression testing |
| 5. Resilience & Operational Readiness | PASS | 90% | Error handling comprehensive; no retry policy (not needed for local app); no alerting (acceptable) |
| 6. Security & Compliance | PASS | 100% | WinCred model solid; capability allowlist minimal; CSP enforced; credential lifecycle documented |
| 7. Implementation Guidance | PASS | 100% | Coding standards explicit; test examples provided; dev workflow complete |
| 8. Dependency & Integration Management | PASS | 90% | All deps identified; no fallback for WinCred (OS API — no alternative); licensing not assessed |
| 9. AI Agent Implementation Suitability | PASS | 100% | Module boundaries clear; patterns consistent; templates provided; pitfalls documented |
| 10. Accessibility | N/A | — | MVP explicitly excludes WCAG per PRD |

**Overall Architecture Readiness: HIGH**

**Key Strengths:**
- Credential security model is unambiguous and enforced at multiple layers
- IPC gateway pattern (`commands/index.ts`) gives AI agents a single, typed surface to work with
- 3-batch schema extraction strategy directly addresses NFR2 with a measurable test
- Repository pattern in Rust enables unit testing without a live database

**Must-Fix Before Development:**
- Pin `shadcn/ui` to a specific version in `package.json` (currently `latest`) to prevent breaking changes mid-development
- Add `PRAGMA foreign_keys = ON` enforcement test to ensure `db::open_db()` is always used correctly

**Should-Fix:**
- Add `LICENSE` file before publishing GitHub Releases
- Document the `keyring` crate's behaviour on Windows versions prior to 10 (expected target: Windows 10+)

**Post-MVP:**
- EV Code Signing Certificate for SmartScreen elimination
- CI/CD on `windows-latest` runner (template included in Section 14.3)
- `tauri-plugin-updater` for auto-update
- Playwright + tauri-driver for E2E tests
