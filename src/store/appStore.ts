import { create } from 'zustand'
import type { Annotation, PgColumn, PgTable, PromptBlock, SchemaTree } from '../types'

interface AppState {
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
  setConnectionStatus: (status: AppState['connectionStatus'], error?: string) => void
  clearConnection: () => void
  setSchemaTree: (tree: SchemaTree | null) => void
  setSchemaProgress: (progress: { loaded: number; total: number } | null) => void
  setSchemaFilter: (filter: string) => void
  toggleTable: (schema: string, table: string, columns: PgColumn[]) => void
  toggleColumn: (schema: string, table: string, column: string) => void
  selectAllInSchema: (schemaName: string, tables: PgTable[]) => void
  deselectAllInSchema: (schemaName: string) => void
  setAnnotation: (key: string, annotation: Annotation) => void
  removeAnnotation: (key: string) => void
  setPrompt: (prompt: PromptBlock | null) => void
  setIsGenerating: (v: boolean) => void
}

export const useAppStore = create<AppState>()((set) => ({
  connectionStatus: 'idle',
  connectionError: null,
  schemaTree: null,
  schemaProgress: null,
  schemaFilter: '',
  selectedTables: new Set<string>(),
  selectedColumns: new Set<string>(),
  annotations: new Map<string, Annotation>(),
  prompt: null,
  isGenerating: false,
  setConnectionStatus: (status, error) =>
    set({ connectionStatus: status, connectionError: error ?? null }),
  clearConnection: () =>
    set({
      connectionStatus: 'idle',
      connectionError: null,
      schemaTree: null,
      schemaProgress: null,
      schemaFilter: '',
      selectedTables: new Set<string>(),
      selectedColumns: new Set<string>(),
      annotations: new Map<string, Annotation>(),
      prompt: null,
      isGenerating: false,
    }),
  setSchemaTree: (tree) => set({ schemaTree: tree }),
  setSchemaProgress: (progress) => set({ schemaProgress: progress }),
  setSchemaFilter: (filter) => set({ schemaFilter: filter }),
  toggleTable: (schema, table, columns) =>
    set((state) => {
      const tableKey = `${schema}.${table}`
      const nextTables = new Set(state.selectedTables)
      const nextColumns = new Set(state.selectedColumns)
      if (nextTables.has(tableKey)) {
        nextTables.delete(tableKey)
        for (const col of columns) {
          nextColumns.delete(`${tableKey}.${col.name}`)
        }
      } else {
        nextTables.add(tableKey)
        for (const col of columns) {
          nextColumns.add(`${tableKey}.${col.name}`)
        }
      }
      return { selectedTables: nextTables, selectedColumns: nextColumns }
    }),
  toggleColumn: (schema, table, column) =>
    set((state) => {
      const tableKey = `${schema}.${table}`
      const columnKey = `${tableKey}.${column}`
      const nextColumns = new Set(state.selectedColumns)
      if (nextColumns.has(columnKey)) {
        nextColumns.delete(columnKey)
      } else {
        nextColumns.add(columnKey)
      }
      const columnPrefix = `${tableKey}.`
      let hasAny = false
      for (const key of nextColumns) {
        if (key.startsWith(columnPrefix)) {
          hasAny = true
          break
        }
      }
      const nextTables = new Set(state.selectedTables)
      if (hasAny) {
        nextTables.add(tableKey)
      } else {
        nextTables.delete(tableKey)
      }
      return { selectedTables: nextTables, selectedColumns: nextColumns }
    }),
  selectAllInSchema: (schemaName, tables) =>
    set((state) => {
      const nextTables = new Set(state.selectedTables)
      const nextColumns = new Set(state.selectedColumns)
      for (const table of tables) {
        const tableKey = `${schemaName}.${table.name}`
        nextTables.add(tableKey)
        for (const col of table.columns) {
          nextColumns.add(`${tableKey}.${col.name}`)
        }
      }
      return { selectedTables: nextTables, selectedColumns: nextColumns }
    }),
  deselectAllInSchema: (schemaName) =>
    set((state) => {
      const prefix = `${schemaName}.`
      const nextTables = new Set<string>()
      for (const key of state.selectedTables) {
        if (!key.startsWith(prefix)) nextTables.add(key)
      }
      const nextColumns = new Set<string>()
      for (const key of state.selectedColumns) {
        if (!key.startsWith(prefix)) nextColumns.add(key)
      }
      return { selectedTables: nextTables, selectedColumns: nextColumns }
    }),
  setAnnotation: (key, annotation) =>
    set((state) => {
      const next = new Map(state.annotations)
      next.set(key, annotation)
      return { annotations: next }
    }),
  removeAnnotation: (key) =>
    set((state) => {
      if (!state.annotations.has(key)) return {}
      const next = new Map(state.annotations)
      next.delete(key)
      return { annotations: next }
    }),
  setPrompt: (prompt) => set({ prompt }),
  setIsGenerating: (v) => set({ isGenerating: v }),
}))
