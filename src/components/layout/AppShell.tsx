import { FC, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NavItem from './NavItem'

const AppShell: FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="h-screen flex bg-background text-foreground">
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
  )
}

export default AppShell
