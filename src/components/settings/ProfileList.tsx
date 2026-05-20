import { FC, useEffect, useState } from 'react'
import { commands } from '@/commands'
import { useAppStore } from '@/store/appStore'
import type { ConnectionProfile, TauriCommandError } from '@/types'
import ProfileListItem from './ProfileListItem'
import DeleteProfileDialog from './DeleteProfileDialog'

const ProfileList: FC = () => {
  const savedProfiles = useAppStore(s => s.savedProfiles)
  const setSavedProfiles = useAppStore(s => s.setSavedProfiles)
  const removeSavedProfile = useAppStore(s => s.removeSavedProfile)
  const [pendingDelete, setPendingDelete] = useState<ConnectionProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    commands.listProfiles()
      .then(setSavedProfiles)
      .catch(() => { /* silently ignore — empty list is graceful default */ })
  }, [setSavedProfiles])

  const handleConfirmDelete = async () => {
    if (pendingDelete === null) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await commands.deleteProfile(pendingDelete.id)
      removeSavedProfile(pendingDelete.id)
      setPendingDelete(null)
    } catch (err) {
      setDeleteError((err as TauriCommandError)?.message ?? String(err))
    } finally {
      setIsDeleting(false)
    }
  }

  if (savedProfiles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-3 border border-dashed border-border rounded">
        No saved profiles yet. Connect to a database and save a profile from the Connection screen to see it here.
      </p>
    )
  }

  return (
    <>
      <ul className="border border-border rounded">
        {savedProfiles.map(p => (
          <ProfileListItem
            key={p.id}
            profile={p}
            onRequestDelete={setPendingDelete}
          />
        ))}
      </ul>
      {deleteError !== null && (
        <p className="text-sm text-destructive mt-2">Delete failed: {deleteError}</p>
      )}
      <DeleteProfileDialog
        profile={pendingDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => { if (!isDeleting) { setPendingDelete(null); setDeleteError(null) } }}
      />
    </>
  )
}

export default ProfileList
