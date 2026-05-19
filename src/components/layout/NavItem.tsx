import { FC, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItemProps {
  to: string
  label: string
  icon?: ReactNode
}

const NavItem: FC<NavItemProps> = ({ to, label, icon }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

export default NavItem
