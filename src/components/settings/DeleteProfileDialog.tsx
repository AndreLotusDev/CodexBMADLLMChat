import { FC, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConnectionProfile } from '@/types'

interface DeleteProfileDialogProps {
  profile: ConnectionProfile | null
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

const DeleteProfileDialog: FC<DeleteProfileDialogProps> = ({ profile, isDeleting, onConfirm, onCancel }) => {
  useEffect(() => {
    if (profile === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [profile, isDeleting, onCancel])

  if (profile === null) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => { if (!isDeleting) onCancel() }}
    >
      <div
        className="bg-background border border-border rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={20} />
          <div>
            <h2 id="delete-profile-title" className="text-lg font-semibold">Delete profile?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Are you sure you want to delete <strong>{profile.name}</strong>? This will also remove its saved password from Windows Credential Manager and delete all its annotations. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>Cancel</Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeleteProfileDialog
