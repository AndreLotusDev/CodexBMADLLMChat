# 5. API Specification (Tauri IPC Commands)

## 5.1 Connection Commands

```typescript
invoke<void>('test_connection', {
  host: string, port: number, database: string,
  username: string, password: string,
}): Promise<void>

invoke<SchemaTree>('connect_and_extract_schema', {
  profileId: string,
}): Promise<SchemaTree>

invoke<void>('disconnect'): Promise<void>
```

## 5.2 Profile Commands

```typescript
invoke<ConnectionProfile[]>('list_profiles'): Promise<ConnectionProfile[]>

invoke<ConnectionProfile>('save_profile', {
  name: string, host: string, port: number,
  database: string, username: string, password: string,
}): Promise<ConnectionProfile>

invoke<void>('rename_profile', {
  profileId: string, newName: string,
}): Promise<void>

invoke<void>('delete_profile', {
  profileId: string,
}): Promise<void>
```

## 5.3 Annotation Commands

```typescript
invoke<Annotation[]>('load_annotations', {
  profileId: string,
}): Promise<Annotation[]>

invoke<Annotation>('upsert_annotation', {
  profileId: string, schemaName: string, tableName: string,
  columnName: string | null, text: string,
}): Promise<Annotation>

invoke<void>('delete_annotation', {
  annotationId: string,
}): Promise<void>
```

## 5.4 Prompt Generation Command

```typescript
invoke<PromptBlock>('generate_prompt', {
  profileId: string,
  selectedTables: Array<{
    schemaName: string,
    tableName: string,
    selectedColumns: string[],
  }>,
}): Promise<PromptBlock>
```

## 5.5 Clipboard Command

```typescript
invoke<void>('copy_to_clipboard', { text: string }): Promise<void>
```

## 5.6 Tauri Events (Backend → Frontend)

```typescript
listen<{ tablesLoaded: number; totalTables: number }>('schema_progress', handler)
listen<{ reason: string }>('connection_lost', handler)
```

## 5.7 Error Convention

```typescript
interface TauriCommandError {
  code: string;
  message: string;
}
```

---
