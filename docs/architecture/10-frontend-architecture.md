# 10. Frontend Architecture

## 10.1 Component Architecture

### Component Organization

```plaintext
src/
├── components/
│   ├── ui/                        # shadcn/ui generated components
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   └── NavItem.tsx
│   ├── connection/
│   │   ├── ConnectionForm.tsx
│   │   ├── ProfileDropdown.tsx
│   │   └── TestConnectionBanner.tsx
│   ├── schema/
│   │   ├── SchemaTree.tsx
│   │   ├── SchemaNode.tsx
│   │   ├── TableNode.tsx
│   │   ├── ColumnNode.tsx
│   │   ├── AnnotationInput.tsx
│   │   └── SchemaSearchBar.tsx
│   ├── prompt/
│   │   ├── PromptPreview.tsx
│   │   └── CopyButton.tsx
│   └── settings/
│       ├── ProfileList.tsx
│       ├── ProfileListItem.tsx
│       └── DeleteProfileDialog.tsx
├── screens/
│   ├── ConnectionScreen.tsx
│   ├── SchemaBrowserScreen.tsx
│   ├── PromptPreviewScreen.tsx
│   └── SettingsScreen.tsx
├── store/
│   └── appStore.ts
├── commands/
│   └── index.ts
├── hooks/
│   ├── useDebounce.ts
│   └── useTauriEvents.ts
├── types/
│   └── index.ts
├── lib/
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css
```

### Component Template

```typescript
import { FC } from 'react'

interface TableNodeProps {
  schemaName: string
  tableName: string
  columns: PgColumn[]
}

const TableNode: FC<TableNodeProps> = ({ schemaName, tableName, columns }) => {
  const { selection, toggleTable } = useAppStore()
  const isChecked = selection.tables.has(`${schemaName}.${tableName}`)

  return (
    <div className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded">
      <Checkbox
        checked={isChecked}
        onCheckedChange={() => toggleTable(schemaName, tableName, columns)}
      />
      <span className="text-sm font-medium">{tableName}</span>
    </div>
  )
}

export default TableNode
```

## 10.2 State Management Architecture

### State Structure

```typescript
interface AppState {
  activeProfile: ConnectionProfile | null
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error'
  connectionError: string | null
  schemaTree: SchemaTree | null
  schemaProgress: { loaded: number; total: number } | null
  schemaFilter: string
  selectedTables: Set<string>
  selectedColumns: Set<string>
  annotations: Map<string, Annotation>
  prompt: PromptBlock | null
  isGenerating: boolean

  // Actions
  setActiveProfile: (profile: ConnectionProfile | null) => void
  setConnectionStatus: (status: AppState['connectionStatus'], error?: string) => void
  setSchemaTree: (tree: SchemaTree) => void
  setSchemaProgress: (progress: { loaded: number; total: number } | null) => void
  setSchemaFilter: (filter: string) => void
  toggleTable: (schema: string, table: string, columns: PgColumn[]) => void
  toggleColumn: (schema: string, table: string, column: string) => void
  setAnnotation: (key: string, annotation: Annotation) => void
  removeAnnotation: (key: string) => void
  setPrompt: (prompt: PromptBlock | null) => void
  setIsGenerating: (v: boolean) => void
  clearConnection: () => void
}
```

### State Management Patterns
- Selectors over raw state — components use `useAppStore(s => s.field)` not `useAppStore()`
- Actions are the only write path — no component mutates state directly
- `clearConnection()` resets all runtime state on disconnect or `connection_lost`
- `Set` and `Map` updates use spread to trigger re-renders

## 10.3 Routing Architecture

### Route Organization

```plaintext
/ (AppShell — HashRouter)
├── /connection       → ConnectionScreen   (default)
├── /schema           → SchemaBrowserScreen (requires activeProfile)
├── /prompt           → PromptPreviewScreen  (requires prompt)
└── /settings         → SettingsScreen
```

### Protected Route Pattern

```typescript
const RequiresConnection: FC<{ children: ReactNode }> = ({ children }) => {
  const activeProfile = useAppStore(s => s.activeProfile)
  if (!activeProfile) return <Navigate to="/connection" replace />
  return <>{children}</>
}
```

## 10.4 Frontend Services Layer

### API Client Setup

```typescript
// src/commands/index.ts — all invoke() calls centralized here
import { invoke } from '@tauri-apps/api/core'

export const commands = {
  testConnection: (params: TestConnectionParams) =>
    invoke<void>('test_connection', params),
  connectAndExtractSchema: (profileId: string) =>
    invoke<SchemaTree>('connect_and_extract_schema', { profileId }),
  disconnect: () => invoke<void>('disconnect'),
  listProfiles: () => invoke<ConnectionProfile[]>('list_profiles'),
  saveProfile: (params: SaveProfileParams) =>
    invoke<ConnectionProfile>('save_profile', params),
  renameProfile: (profileId: string, newName: string) =>
    invoke<void>('rename_profile', { profileId, newName }),
  deleteProfile: (profileId: string) =>
    invoke<void>('delete_profile', { profileId }),
  loadAnnotations: (profileId: string) =>
    invoke<Annotation[]>('load_annotations', { profileId }),
  upsertAnnotation: (params: UpsertAnnotationParams) =>
    invoke<Annotation>('upsert_annotation', params),
  deleteAnnotation: (annotationId: string) =>
    invoke<void>('delete_annotation', { annotationId }),
  generatePrompt: (params: GeneratePromptParams) =>
    invoke<PromptBlock>('generate_prompt', params),
  copyToClipboard: (text: string) =>
    invoke<void>('copy_to_clipboard', { text }),
}
```

---
