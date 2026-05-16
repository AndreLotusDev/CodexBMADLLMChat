# 16. Testing Strategy

## 16.1 Testing Pyramid

```plaintext
          [ E2E Tests ]
           — None MVP —

     [ Integration Tests ]
  Rust: DB connectivity + SQLite
  (real PostgreSQL required, #[ignore])

[ Frontend Unit ]     [ Backend Unit ]
Vitest + jsdom        cargo test (no DB)
Components, store     Schema extractor logic,
utilities             prompt generator,
                      repositories (in-memory SQLite)
```

## 16.2 Test Organization

**Frontend:** `src/__tests__/` — components, store, lib utilities

**Backend:** `#[cfg(test)]` modules in each service/repository file + `src-tauri/tests/integration/` for `#[ignore]` integration tests

**E2E:** None for MVP. Post-MVP: Playwright + tauri-driver.

## 16.3 Frontend Test Example

```typescript
// appStore.test.ts
it('toggleTable selects all columns when checking a table', () => {
  const columns = [
    { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
    { name: 'email', dataType: 'text', isNullable: false, isPrimaryKey: false },
  ]
  useAppStore.getState().toggleTable('public', 'users', columns)
  const { selectedTables, selectedColumns } = useAppStore.getState()
  expect(selectedTables.has('public.users')).toBe(true)
  expect(selectedColumns.has('public.users.id')).toBe(true)
})
```

## 16.4 Backend Unit Test Example

```rust
#[test]
fn prompt_includes_annotation_as_comment() {
    let generator = PromptGenerator::new();
    let result = generator.generate(&selection, &[annotation], &tables).unwrap();
    assert!(result.content.contains("-- Stores all registered users"));
}
```

## 16.5 Integration Test Example

```rust
#[tokio::test]
#[ignore = "requires local PostgreSQL on port 5432"]
async fn extraction_completes_within_5_seconds() {
    let pool = sqlx::PgPool::connect("postgresql://postgres:testpass@localhost:5432/postgres")
        .await.unwrap();
    let start = std::time::Instant::now();
    SchemaExtractor::new().extract_headless(&pool).await.unwrap();
    assert!(start.elapsed().as_secs() < 5);
}
```

## 16.6 Vitest Configuration

```typescript
// vite.config.ts test block
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/__tests__/setup.ts'],
  mockReset: true,
}

// setup.ts — mock all Tauri IPC
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn(() => Promise.resolve(() => {})) }))
```

---
