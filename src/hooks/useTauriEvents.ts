import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useAppStore } from '../store/appStore'

export function useTauriEvents() {
  const setSchemaProgress = useAppStore(s => s.setSchemaProgress)

  useEffect(() => {
    const unlistenProgress = listen<{ tablesLoaded: number; totalTables: number }>(
      'schema_progress',
      (event) => setSchemaProgress({ loaded: event.payload.tablesLoaded, total: event.payload.totalTables })
    )
    return () => { unlistenProgress.then(fn => fn()) }
  }, [setSchemaProgress])
}
