import { FC, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NavItem from './NavItem'
import { useTauriEvents } from '../../hooks/useTauriEvents'
import { isTauriAvailable } from '../../lib/tauriBridge'

const AppShell: FC = () => {
  useTauriEvents()

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const tauriAvailable = isTauriAvailable()

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {!tauriAvailable && (
        <div
          role="status"
          className="shrink-0 px-3 py-1.5 text-xs bg-muted text-muted-foreground border-b border-border"
        >
          Running in browser-only preview — Tauri IPC unavailable. Launch via{' '}
          <code className="font-mono">npm run tauri dev</code> for database features.
        </div>
      )}
      <div className="flex-1 flex min-h-0">
        <aside className="w-52 shrink-0 flex flex-col gap-1 p-3 border-r border-border">
          <NavItem to="/connection" label="Connection" />
          <NavItem to="/schema" label="Schema Browser" />
          <NavItem to="/prompt" label="Prompt Preview" />
          <NavItem to="/settings" label="Settings" />
        </aside>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
