# Epic 1: Foundation & Project Setup

**Goal:** Establish the Tauri v2 + React (TypeScript) project scaffold with a working Windows desktop application that launches, displays a basic shell UI with navigation. This epic ensures every subsequent epic builds on a solid, runnable foundation.

## Story 1.1: Initialize Tauri + React Project Scaffold

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

## Story 1.2: Basic Shell UI with Navigation

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
