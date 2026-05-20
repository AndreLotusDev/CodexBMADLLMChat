import { FC, useState } from 'react'
import { Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { commands } from '@/commands'
import { useAppStore } from '@/store/appStore'
import type { TauriCommandError } from '@/types'

interface SaveProfileInlineProps {
  host: string
  port: number
  database: string
  username: string
  password: string
}

const SaveProfileInline: FC<SaveProfileInlineProps> = ({ host, port, database, username, password }) => {
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const addSavedProfile = useAppStore(s => s.addSavedProfile)
  const setActiveProfile = useAppStore(s => s.setActiveProfile)

  if (dismissed) return null

  const handleSave = async () => {
    if (name.trim() === '') {
      setError('Profile name is required')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const profile = await commands.saveProfile({
        name: name.trim(),
        host,
        port,
        database,
        username,
        password,
      })
      addSavedProfile(profile)
      setActiveProfile(profile)
      setDismissed(true)
    } catch (err) {
      const tauri = err as TauriCommandError
      setError(tauri?.message ?? String(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 border border-border rounded-md bg-muted/30 max-w-md">
      <p className="text-sm font-medium">Save this connection as a profile?</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">Profile Name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Prod DB"
          disabled={isSaving}
        />
      </div>
      {error !== null && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving || name.trim() === ''} size="sm">
          <Save size={14} className="mr-1" />
          {isSaving ? 'Saving…' : 'Save Profile'}
        </Button>
        <Button onClick={() => setDismissed(true)} variant="ghost" size="sm" disabled={isSaving}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}

export default SaveProfileInline
