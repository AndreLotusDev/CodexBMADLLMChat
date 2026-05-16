# User Interface Design Goals

## Overall UX Vision

A clean, utilitarian desktop tool that feels familiar to developers but is approachable enough for non-technical users. The UI prioritizes speed and clarity — connect, select, annotate, copy — with no unnecessary steps between the user and their LLM prompt.

## Key Interaction Paradigms

- **Connect-then-browse:** User connects to a DB first, then navigates the schema tree
- **Checkbox-driven selection:** Multi-select tables from a tree or list view with checkboxes
- **Inline annotation:** Click a table or column to add a description without leaving the main view
- **One-click copy:** A single prominent "Copy Prompt" button closes the loop

## Core Screens and Views

1. **Connection Screen** — Enter/select a saved PostgreSQL connection profile
2. **Schema Browser** — Tree or list view of all schemas/tables/columns with checkboxes
3. **Annotation Panel** — Sidebar or inline editor for table/column descriptions
4. **Prompt Preview** — Read-only view of the generated LLM prompt block
5. **Settings/Profiles** — Manage saved connection profiles and annotation sets

## Accessibility

None (MVP — no specific WCAG target)

## Branding

No specific branding requirements for MVP. Clean, neutral UI with dark mode as default.

## Target Device and Platforms

Windows Desktop only.

---
