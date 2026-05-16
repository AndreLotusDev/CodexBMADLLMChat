# 15. Security and Performance

## 15.1 Security Requirements

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

## 15.2 Credential Security Model

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

## 15.3 Performance Optimization

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
