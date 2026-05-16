# Requirements

## Functional

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

## Non Functional

- **NFR1:** The app shall be a desktop application targeting **Windows only**.
- **NFR2:** Schema extraction for a database with up to 200 tables shall complete in under 5 seconds on a local network connection.
- **NFR3:** The app shall store connection credentials securely using Windows Credential Manager — never plain text.
- **NFR4:** The app shall function fully offline after initial setup (no cloud dependency for core features).
- **NFR5:** The UI shall be operable by non-technical users without requiring SQL knowledge.
- **NFR6:** The app shall have no external telemetry or data collection without explicit user consent.

---
