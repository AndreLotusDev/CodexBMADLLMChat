import { create } from 'zustand'

interface AppState {
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error'
  connectionError: string | null
  setConnectionStatus: (status: AppState['connectionStatus'], error?: string) => void
  clearConnection: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  connectionStatus: 'idle',
  connectionError: null,
  setConnectionStatus: (status, error) =>
    set({ connectionStatus: status, connectionError: error ?? null }),
  clearConnection: () =>
    set({ connectionStatus: 'idle', connectionError: null }),
}))
