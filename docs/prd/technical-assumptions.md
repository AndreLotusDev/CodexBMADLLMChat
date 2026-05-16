# Technical Assumptions

## Repository Structure

Monorepo — Single repository containing the desktop app and any shared utilities.

## Service Architecture

Desktop Monolith — A single self-contained desktop application with no backend server or cloud services. All logic (DB connection, schema extraction, prompt generation, local storage) runs on the user's machine.

**Tech Stack:**
- **Framework:** Tauri v2 + React (TypeScript)
- **DB Driver:** `pg` (node-postgres) via Tauri Rust backend plugin for PostgreSQL connectivity
- **Local Storage:** SQLite (via `better-sqlite3` or Tauri plugin) for persisting connection profiles and annotations
- **Credential Storage:** Windows Credential Manager for secure password storage

## Testing Requirements

Unit + Integration — Unit tests for core logic (schema parsing, prompt generation). Integration tests for DB connectivity against a real PostgreSQL instance. No E2E automation for MVP.

## Additional Technical Assumptions

- App will be distributed as a standalone `.exe` installer (no Microsoft Store for MVP)
- No auto-update mechanism required for MVP
- No telemetry or analytics in MVP (aligns with NFR6)
- CI/CD pipeline will be added post-MVP

---
