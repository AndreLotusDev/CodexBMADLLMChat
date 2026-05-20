import { FC, useState, KeyboardEvent } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { commands } from '@/commands'
import { useAppStore } from '@/store/appStore'
import type { ConnectionProfile, TauriCommandError } from '@/types'

interface ProfileListItemProps {
  profile: ConnectionProfile
  onRequestDelete: (profile: ConnectionProfile) => void
}

const ProfileListItem: FC<ProfileListItemProps> = ({ profile, onRequestDelete }) => {
  const renameSavedProfile = useAppStore(s => s.renameSavedProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(profile.name)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = () => { setDraft(profile.name); setError(null); setIsEditing(true) }
  const cancel = () => { setDraft(profile.name); setError(null); setIsEditing(false) }

  const commit = async () => {
    const trimmed = draft.trim()
    if (trimmed === '' || trimmed === profile.name) { cancel(); return }
    setIsSaving(true)
    try {
      await commands.renameProfile(profile.id, trimmed)
      renameSavedProfile(profile.id, trimmed)
      setIsEditing(false)
    } catch (err) {
      setError((err as TauriCommandError)?.message ?? String(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); void commit() }
    else if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  return (
    <li className="flex items-center justify-between gap-3 p-3 border-b border-border last:border-b-0">
      <div className="flex flex-col min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              aria-label="Profile name"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKey}
              autoFocus
              disabled={isSaving}
              className="h-8"
            />
            <Button variant="ghost" size="sm" onClick={commit} disabled={isSaving} aria-label="Save name">
              <Check size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isSaving} aria-label="Cancel rename">
              <X size={14} />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="text-left text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
            aria-label={`Rename profile ${profile.name}`}
          >
            {profile.name}
            <Pencil size={12} className="inline ml-2 text-muted-foreground" />
          </button>
        )}
        <span className="text-xs text-muted-foreground truncate">
          {profile.host}:{profile.port}/{profile.database}
        </span>
        {error !== null && <span className="text-xs text-destructive mt-1">{error}</span>}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRequestDelete(profile)}
        className="text-destructive border-destructive hover:bg-destructive/10"
        aria-label={`Delete profile ${profile.name}`}
      >
        <Trash2 size={14} className="mr-1" />
        Delete
      </Button>
    </li>
  )
}

export default ProfileListItem
