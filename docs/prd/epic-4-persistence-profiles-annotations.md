# Epic 4: Persistence — Profiles & Annotations

**Goal:** Save connection profiles and annotation sets to local storage so users don't need to re-enter credentials or re-annotate their schema on every session. This epic transforms the app from a one-time demo into a reliable daily tool.

## Story 4.1: Save & Load Connection Profiles

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

## Story 4.2: Persist Annotations Across Sessions

As a user,
I want my table and column annotations to be saved automatically,
so that I don't have to re-annotate my schema every time I open the app.

**Acceptance Criteria:**
1. Annotations are saved automatically when the user types (no explicit save button required)
2. Annotations are stored locally in SQLite, keyed by connection profile + schema + table + column
3. When reconnecting with a saved profile, existing annotations are restored and displayed in the tree
4. Deleting a connection profile also deletes all associated annotations
5. Annotations survive app restarts

## Story 4.3: Manage Saved Profiles from Settings Screen

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
