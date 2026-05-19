import { create } from 'zustand'
import type { SchemaTree } from '../types'

interface AppState {
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error'
  connectionError: string | null
  schemaTree: SchemaTree | null
  schemaProgress: { loaded: number; total: number } | null
  schemaFilter: string
  setConnectionStatus: (status: AppState['connectionStatus'], error?: string) => void
  clearConnection: () => void
  setSchemaTree: (tree: SchemaTree | null) => void
  setSchemaProgress: (progress: { loaded: number; total: number } | null) => void
  setSchemaFilter: (filter: string) => void
}

export const useAppStore = create<AppState>()((set) => ({
  connectionStatus: 'idle',
  connectionError: null,
  schemaTree: null,
  schemaProgress: null,
  schemaFilter: '',
  setConnectionStatus: (status, error) =>
    set({ connectionStatus: status, connectionError: error ?? null }),
  clearConnection: () =>
    set({
      connectionStatus: 'idle',
      connectionError: null,
      schemaTree: null,
      schemaProgress: null,
      schemaFilter: '',
    }),
  setSchemaTree: (tree) => set({ schemaTree: tree }),
  setSchemaProgress: (progress) => set({ schemaProgress: progress }),
  setSchemaFilter: (filter) => set({ schemaFilter: filter }),
}))
