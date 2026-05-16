# 17. Coding Standards

## 17.1 Critical Fullstack Rules

- **Type Mirroring:** Every Rust IPC struct has a matching TypeScript interface in `src/types/index.ts`; serde `rename_all = "camelCase"` handles the naming bridge
- **IPC Gateway:** All `invoke()` calls go through `src/commands/index.ts` — no component imports `@tauri-apps/api` directly
- **No Password in Store:** Zustand store never holds a password field; password exists in React local state only during form input
- **Annotation Key Convention:** Always use `buildAnnotationKey()` from `src/lib/utils.ts` — never construct keys inline
- **Rust Error Propagation:** All fallible Rust functions return `Result<T, AppError>`; never `.unwrap()` or `.expect()` in non-test code
- **SQLite Pragma on Open:** Every connection opened via `db::open_db()` — never call `Connection::open()` directly
- **Command Handlers Stay Thin:** `#[tauri::command]` functions ≤ ~15 lines; no business logic in handlers

## 17.2 Naming Conventions

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

## 17.3 Key Rust Patterns

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

## 17.4 Key React Patterns

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
