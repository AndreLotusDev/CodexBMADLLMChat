// Zustand global store — stub for Story 1.1
// Full implementation in subsequent stories.
import { create } from 'zustand'

// Placeholder type — expanded with real fields in Story 1.2+
type AppState = Record<string, never>

export const useAppStore = create<AppState>()(() => ({}))
