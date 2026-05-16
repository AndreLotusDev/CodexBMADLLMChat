# 1. Introduction

This document outlines the complete fullstack architecture for **SchemaLift (CodexBMAD LLM Chat)**, including the Rust/Tauri backend layer, React frontend implementation, and their integration via Tauri's IPC bridge. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This is a **desktop monolith**, not a traditional web fullstack. The "backend" is Tauri's Rust core (handling DB connections, credential storage, SQLite persistence, and schema extraction), while the "frontend" is a React/TypeScript UI running in a WebView. The two communicate exclusively via Tauri commands (IPC) — there is no HTTP server, no REST API, and no cloud layer. All data stays on the user's machine.

## 1.1 Starter Template / Existing Project

**Decision:** `npm create tauri-app` greenfield scaffold using the Tauri v2 + React + TypeScript template (official Tauri starter). No third-party fullstack starter — this is a native desktop app and standard web fullstack starters (T3, MERN) don't apply.

**Constraints from scaffold:**
- Tauri v2 project structure: `src/` (React frontend) + `src-tauri/` (Rust backend)
- Vite as the frontend bundler (included by default)
- Cargo workspace for the Rust side

## 1.2 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-05-15 | 0.1 | Initial draft | Winston (Architect) |

---
