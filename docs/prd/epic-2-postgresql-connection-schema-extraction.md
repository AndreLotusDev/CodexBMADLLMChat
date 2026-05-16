# Epic 2: PostgreSQL Connection & Schema Extraction

**Goal:** Enable the user to enter PostgreSQL connection credentials, test and establish a connection, and browse the full database schema (schemas, tables, columns, data types, constraints, foreign keys) in an interactive tree view. This epic delivers the core data pipeline that all subsequent epics depend on.

## Story 2.1: Connection Screen & Credential Input

As a user,
I want to enter my PostgreSQL connection details in a form,
so that I can connect to my database.

**Acceptance Criteria:**
1. Connection screen renders a form with fields: Host, Port (default 5432), Database, Username, Password
2. Form validates that all required fields are filled before allowing submission
3. A "Test Connection" button attempts to connect and shows a success or error message inline
4. Connection errors display a human-readable message (e.g., "Could not reach host" vs. "Authentication failed")
5. Password field is masked by default with a show/hide toggle

## Story 2.2: Schema Extraction & Tree View

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

## Story 2.3: Schema Search & Filter

As a user,
I want to search and filter the schema tree by name,
so that I can quickly find tables or columns in large databases.

**Acceptance Criteria:**
1. A search input above the tree filters tables and columns in real time as the user types
2. Matching nodes are highlighted; non-matching nodes are hidden
3. Clearing the search restores the full tree
4. Search is case-insensitive

---
