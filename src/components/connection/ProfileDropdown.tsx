import { ChangeEvent, FC } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/appStore'
import { commands } from '@/commands'
import type { TauriCommandError } from '@/types'

const ProfileDropdown: FC = () => {
  const savedProfiles = useAppStore(s => s.savedProfiles)
  const activeProfile = useAppStore(s => s.activeProfile)
  const setActiveProfile = useAppStore(s => s.setActiveProfile)
  const removeSavedProfile = useAppStore(s => s.removeSavedProfile)

  if (savedProfiles.length === 0) return null

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (id === '') {
      setActiveProfile(null)
      return
    }
    const profile = savedProfiles.find(p => p.id === id) ?? null
    setActiveProfile(profile)
  }

  const handleDelete = async () => {
    if (activeProfile === null) return
    if (!window.confirm(`Delete profile "${activeProfile.name}"? This also removes its saved password.`)) return
    try {
      await commands.deleteProfile(activeProfile.id)
      removeSavedProfile(activeProfile.id)
    } catch (err) {
      const tauri = err as TauriCommandError
      window.alert(`Delete failed: ${tauri?.message ?? String(err)}`)
    }
  }

  return (
    <div className="flex items-end gap-2 max-w-md">
      <div className="flex flex-col gap-1.5 flex-1">
        <label htmlFor="profile-select" className="text-sm font-medium">Saved Profile</label>
        <select
          id="profile-select"
          value={activeProfile?.id ?? ''}
          onChange={handleChange}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— Manual entry —</option>
          {savedProfiles.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.host}:{p.port}/{p.database})</option>
          ))}
        </select>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={activeProfile === null}
        aria-label="Delete selected profile"
      >
        <Trash2 size={14} className="mr-1" />
        Delete
      </Button>
    </div>
  )
}

export default ProfileDropdown
