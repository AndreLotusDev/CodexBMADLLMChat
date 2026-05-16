# CodexBMAD LLM Chat — Product Requirements Document (PRD)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-15 | 0.1 | Initial draft | John (PM) |

---

## Goals and Background Context

### Goals

- Eliminate the repetitive manual workflow of right-clicking tables in DBeaver, copying DDL one-by-one, and pasting into ChatGPT
- Enable one-shot schema context bundling for any SQL database
- Allow users to annotate tables/columns to add semantic meaning before sending to an LLM
- Support both technical developers and non-technical users in getting accurate SQL help from LLMs
- Deliver a desktop application targeting Windows (SQL databases only, no NoSQL) for MVP

### Success Metrics

- A user can go from cold app launch to first clipboard copy in **under 2 minutes** on a database with up to 20 tables
- Schema extraction for a 200-table PostgreSQL database completes in **under 5 seconds**
- A returning user can reconnect and regenerate their last prompt in **under 30 seconds** (saved profile + persisted annotations)
- **Zero plain-text credential storage** — all passwords stored exclusively via Windows Credential Manager

### Out of Scope (MVP)

The following are explicitly excluded from MVP scope:

- **NoSQL databases** — MongoDB, Redis, DynamoDB, etc. are not supported
- **Non-PostgreSQL SQL engines** — MySQL, SQL Server, SQLite, Oracle support is post-MVP
- **Query execution** — the app reads schema only; it does not run SQL queries
- **Multi-user or collaboration features** — profiles and annotations are local to the machine
- **Cloud sync or backup** — all data stays local; no cloud storage or account system
- **Auto-update mechanism** — users update manually via a new `.exe` installer
- **Custom prompt templates** — the prompt format is fixed for MVP
- **CI/CD pipeline** — to be added post-MVP
- **WCAG accessibility compliance** — not targeted for MVP

### Background Context

Developers and non-technical users who rely on LLMs for SQL assistance face a fundamental friction: LLMs require full schema context to give useful answers, but gathering that context is entirely manual — N right-clicks for N tables, then copy-paste into a chat window. The process scales with database complexity, turning what should be a one-shot question into a multi-minute setup ritual every single time.

This app solves that by connecting directly to SQL databases, extracting the complete schema in one action, and letting users compose an annotated, ready-to-paste LLM prompt block — collapsing N manual steps into one.

---

## Requirements

### Functional

- **FR1:** The app shall connect to SQL databases using user-provided connection credentials (host, port, database name, username, password).
- **FR2:** The app shall support **PostgreSQL** in the MVP. Support for additional SQL engines (MySQL, SQL Server, SQLite, etc.) is planned for future releases.
- **FR3:** The app shall extract and display the full schema of a connected database, including all tables, columns, data types, constraints, indexes, and foreign keys.
- **FR4:** The user shall be able to select one or more tables via a checkbox interface for inclusion in the LLM prompt bundle.
- **FR5:** The user shall be able to annotate individual tables and columns with plain-text descriptions before bundling.
- **FR6:** The app shall generate a formatted, ready-to-paste LLM prompt block containing the selected tables' DDL and any user annotations.
- **FR7:** The user shall be able to copy the generated prompt block to the clipboard with a single action.
- **FR8:** The app shall allow the user to save and reload connection profiles so they don't need to re-enter credentials each session.
- **FR9:** The app shall allow the user to save annotation sets per database/schema so annotations persist across sessions.
- **FR10:** The user shall be able to preview the generated prompt before copying it.

### Non Functional

- **NFR1:** The app shall be a desktop application targeting **Windows only**.
- **NFR2:** Schema extraction for a database with up to 200 tables shall complete in under 5 seconds on a local network connection.
- **NFR3:** The app shall store connection credentials securely using Windows Credential Manager — never plain text.
- **NFR4:** The app shall function fully offline after initial setup (no cloud dependency for core features).
- **NFR5:** The UI shall be operable by non-technical users without requiring SQL knowledge.
- **NFR6:** The app shall have no external telemetry or data collection without explicit user consent.

---

## User Interface Design Goals

### Overall UX Vision

A clean, utilitarian desktop tool that feels familiar to developers but is approachable enough for non-technical users. The UI prioritizes speed and clarity — connect, select, annotate, copy — with no unnecessary steps between the user and their LLM prompt.

### Key Interaction Paradigms

- **Connect-then-browse:** User connects to a DB first, then navigates the schema tree
- **Checkbox-driven selection:** Multi-select tables from a tree or list view with checkboxes
- **Inline annotation:** Click a table or column to add a description without leaving the main view
- **One-click copy:** A single prominent "Copy Prompt" button closes the loop

### Core Screens and Views

1. **Connection Screen** — Enter/select a saved PostgreSQL connection profile
2. **Schema Browser** — Tree or list view of all schemas/tables/columns with checkboxes
3. **Annotation Panel** — Sidebar or inline editor for table/column descriptions
4. **Prompt Preview** — Read-only view of the generated LLM prompt block
5. **Settings/Profiles** — Manage saved connection profiles and annotation sets

### Accessibility

None (MVP — no specific WCAG target)

### Branding

No specific branding requirements for MVP. Clean, neutral UI with dark mode as default.

### Target Device and Platforms

Windows Desktop only.

---

## Technical Assumptions

### Repository Structure

Monorepo — Single repository containing the desktop app and any shared utilities.

### Service Architecture

Desktop Monolith — A single self-contained desktop application with no backend server or cloud services. All logic (DB connection, schema extraction, prompt generation, local storage) runs on the user's machine.

**Tech Stack:**
- **Framework:** Tauri v2 + React (TypeScript)
- **DB Driver:** `pg` (node-postgres) via Tauri Rust backend plugin for PostgreSQL connectivity
- **Local Storage:** SQLite (via `better-sqlite3` or Tauri plugin) for persisting connection profiles and annotations
- **Credential Storage:** Windows Credential Manager for secure password storage

### Testing Requirements

Unit + Integration — Unit tests for core logic (schema parsing, prompt generation). Integration tests for DB connectivity against a real PostgreSQL instance. No E2E automation for MVP.

### Additional Technical Assumptions

- App will be distributed as a standalone `.exe` installer (no Microsoft Store for MVP)
- No auto-update mechanism required for MVP
- No telemetry or analytics in MVP (aligns with NFR6)
- CI/CD pipeline will be added post-MVP

---

## Epic List

- **Epic 1: Foundation & Project Setup** — Establish the Tauri + React project scaffold and a working Windows desktop application shell with basic navigation.
- **Epic 2: PostgreSQL Connection & Schema Extraction** — Enable the user to connect to a PostgreSQL database and browse the full schema in an interactive tree view.
- **Epic 3: Table Selection & Prompt Generation** — Allow the user to select tables, annotate them, generate a formatted LLM prompt block, and copy it to clipboard.
- **Epic 4: Persistence — Profiles & Annotations** — Save connection profiles securely and persist annotation sets across sessions.

---

## Epic 1: Foundation & Project Setup

**Goal:** Establish the Tauri v2 + React (TypeScript) project scaffold with a working Windows desktop application that launches, displays a basic shell UI with navigation. This epic ensures every subsequent epic builds on a solid, runnable foundation.

### Story 1.1: Initialize Tauri + React Project Scaffold

As a developer,
I want a Tauri v2 + React (TypeScript) project initialized with the correct folder structure and dependencies,
so that the team has a working base to build features on.

**Acceptance Criteria:**
1. `npm create tauri-app` (or equivalent) generates a working Tauri v2 + React + TypeScript project
2. App launches on Windows with a blank/placeholder window
3. `npm run dev` starts the development server with hot reload
4. `npm run build` produces a `.exe` installer for Windows
5. Project includes ESLint + Prettier configured with sensible defaults
6. Git repository initialized with `.gitignore` covering `node_modules`, `dist`, and Tauri build artifacts

### Story 1.2: Basic Shell UI with Navigation

As a user,
I want to see a basic app shell with navigation between the main screens,
so that I can understand the app structure and move between sections.

**Acceptance Criteria:**
1. App displays a persistent sidebar or top nav with links to: Connection, Schema Browser, Prompt Preview, Settings
2. Each nav item renders a placeholder screen with its name
3. Active nav item is visually highlighted
4. App window has a minimum size of 900×600px and is resizable
5. App uses a dark theme by default

---

## Epic 2: PostgreSQL Connection & Schema Extraction

**Goal:** Enable the user to enter PostgreSQL connection credentials, test and establish a connection, and browse the full database schema (schemas, tables, columns, data types, constraints, foreign keys) in an interactive tree view. This epic delivers the core data pipeline that all subsequent epics depend on.

### Story 2.1: Connection Screen & Credential Input

As a user,
I want to enter my PostgreSQL connection details in a form,
so that I can connect to my database.

**Acceptance Criteria:**
1. Connection screen renders a form with fields: Host, Port (default 5432), Database, Username, Password
2. Form validates that all required fields are filled before allowing submission
3. A "Test Connection" button attempts to connect and shows a success or error message inline
4. Connection errors display a human-readable message (e.g., "Could not reach host" vs. "Authentication failed")
5. Password field is masked by default with a show/hide toggle

### Story 2.2: Schema Extraction & Tree View

As a user,
I want to see the full schema of my connected PostgreSQL database in a tree view,
so that I can explore all tables and columns at a glance.

**Acceptance Criteria:**
1. After a successful connection, the Schema Browser screen loads automatically
2. Tree view displays all schemas → tables → columns hierarchy
3. Each column shows its name, data type, and nullable status
4. Foreign key relationships are indicated on the relevant columns
5. Primary keys and unique constraints are visually distinguished
6. Tree supports expand/collapse at schema and table level
7. Schema extraction for a database with up to 200 tables completes in under 5 seconds

### Story 2.3: Schema Search & Filter

As a user,
I want to search and filter the schema tree by name,
so that I can quickly find tables or columns in large databases.

**Acceptance Criteria:**
1. A search input above the tree filters tables and columns in real time as the user types
2. Matching nodes are highlighted; non-matching nodes are hidden
3. Clearing the search restores the full tree
4. Search is case-insensitive

---

## Epic 3: Table Selection & Prompt Generation

**Goal:** Allow the user to select one or more tables via checkboxes, add plain-text annotations to tables and columns, and generate a formatted LLM prompt block containing the selected DDL and annotations — culminating in a one-click copy to clipboard. This is the core value proposition of the app.

### Story 3.1: Table & Column Selection via Checkboxes

As a user,
I want to select tables and columns using checkboxes in the schema tree,
so that I can control exactly what context goes into my LLM prompt.

**Acceptance Criteria:**
1. Every table and column in the schema tree has a checkbox
2. Checking a table automatically checks all its columns
3. Unchecking individual columns is possible after a table is checked (partial selection)
4. A "Select All" / "Deselect All" control is available at the schema level
5. Selected item count is displayed (e.g., "3 tables, 12 columns selected")

### Story 3.2: Table & Column Annotation

As a user,
I want to add plain-text descriptions to tables and columns,
so that the generated LLM prompt includes context that isn't in the schema alone.

**Acceptance Criteria:**
1. Clicking a table or column opens an inline annotation input (sidebar or popover)
2. Annotations accept plain text up to 500 characters
3. Annotated tables/columns are visually marked in the tree (e.g., a small icon)
4. Annotations are included in the generated prompt alongside the DDL
5. Clearing an annotation removes the visual marker

### Story 3.3: Prompt Generation & Copy to Clipboard

As a user,
I want to generate a formatted LLM prompt block from my selected tables and copy it with one click,
so that I can immediately paste it into any LLM chat.

**Acceptance Criteria:**
1. A "Generate Prompt" button produces the prompt from currently selected tables/columns
2. The prompt includes: a preamble ("Here is my database schema:"), DDL for each selected table, and any annotations formatted as comments
3. Prompt Preview screen renders the full generated prompt in a read-only code block
4. A "Copy to Clipboard" button copies the full prompt text with a single click
5. A visual confirmation (toast or button state change) confirms the copy succeeded
6. Regenerating the prompt with a different selection updates the preview immediately

---

## Epic 4: Persistence — Profiles & Annotations

**Goal:** Save connection profiles and annotation sets to local storage so users don't need to re-enter credentials or re-annotate their schema on every session. This epic transforms the app from a one-time demo into a reliable daily tool.

### Story 4.1: Save & Load Connection Profiles

As a user,
I want to save my PostgreSQL connection details as a named profile,
so that I can reconnect to my databases without re-entering credentials each time.

**Acceptance Criteria:**
1. After a successful connection, the user is prompted to save it as a named profile
2. Saved profiles appear in a dropdown or list on the Connection screen
3. Selecting a saved profile pre-fills all connection fields except the password
4. Password is retrieved securely from Windows Credential Manager — never stored in plain text
5. User can delete a saved profile, which also removes its credentials from Windows Credential Manager
6. At least 10 saved profiles are supported

### Story 4.2: Persist Annotations Across Sessions

As a user,
I want my table and column annotations to be saved automatically,
so that I don't have to re-annotate my schema every time I open the app.

**Acceptance Criteria:**
1. Annotations are saved automatically when the user types (no explicit save button required)
2. Annotations are stored locally in SQLite, keyed by connection profile + schema + table + column
3. When reconnecting with a saved profile, existing annotations are restored and displayed in the tree
4. Deleting a connection profile also deletes all associated annotations
5. Annotations survive app restarts

### Story 4.3: Manage Saved Profiles from Settings Screen

As a user,
I want to view, rename, and delete my saved connection profiles from a Settings screen,
so that I can keep my profile list organized.

**Acceptance Criteria:**
1. Settings screen lists all saved connection profiles with their name and host
2. User can rename a profile inline
3. User can delete a profile with a confirmation prompt
4. Deleting a profile removes it from the list, clears its credentials from Windows Credential Manager, and deletes associated annotations
5. Settings screen is accessible from the main navigation at all times

---

## Checklist Results Report

| Category | Status | Notes |
|---|---|---|
| 1. Problem Definition & Context | PARTIAL | No competitive analysis; personas vague |
| 2. MVP Scope Definition | PASS | Out-of-scope section added; success metrics defined |
| 3. User Experience Requirements | PARTIAL | No explicit flow diagrams; edge cases deferred |
| 4. Functional Requirements | PASS | Clear, testable, user-focused |
| 5. Non-Functional Requirements | PARTIAL | Reliability NFRs minimal but acceptable for MVP |
| 6. Epic & Story Structure | PASS | Well-sequenced, right-sized stories |
| 7. Technical Guidance | PARTIAL | Trade-off rationale in session context, not fully in doc |
| 8. Cross-Functional Requirements | PARTIAL | SQLite keying defined in stories; no formal entity model |
| 9. Clarity & Communication | PARTIAL | No stakeholder comms plan; solo project so acceptable |

**Overall:** Nearly Ready — blockers resolved. Architect can proceed.

---

## Next Steps

### UX Expert Prompt

Review the PRD at `docs/prd.md` and produce a UI/UX spec for this Windows desktop app (Tauri v2 + React + TypeScript). Focus on the 5 core screens: Connection, Schema Browser, Annotation Panel, Prompt Preview, and Settings. Dark theme, developer-friendly but accessible to non-technical users.

### Architect Prompt

Review the PRD at `docs/prd.md` and produce an architecture document for this Windows desktop app. Stack: Tauri v2 + React (TypeScript), PostgreSQL via Rust backend, SQLite for local persistence, Windows Credential Manager for credential storage. Offline-first, no cloud dependencies, `.exe` distribution.
