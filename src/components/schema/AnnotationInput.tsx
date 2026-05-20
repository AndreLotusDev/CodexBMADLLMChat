import { FC, useState, ChangeEvent } from 'react'
import type { Annotation } from '../../types'
import { useAppStore } from '../../store/appStore'
import { buildAnnotationKey } from '../../lib/utils'

interface AnnotationInputProps {
  schemaName: string
  tableName: string
  columnName: string | null
  onClose: () => void
}

const AnnotationInput: FC<AnnotationInputProps> = ({
  schemaName,
  tableName,
  columnName,
  onClose,
}) => {
  const annotations = useAppStore(s => s.annotations)
  const setAnnotation = useAppStore(s => s.setAnnotation)
  const removeAnnotation = useAppStore(s => s.removeAnnotation)

  const key = buildAnnotationKey(schemaName, tableName, columnName)
  const existing = annotations.get(key)
  const [text, setText] = useState(existing?.text ?? '')

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = e.target.value.slice(0, 500)
    setText(nextText)
    if (nextText.trim() === '') {
      removeAnnotation(key)
      return
    }
    const next: Annotation = {
      id: existing?.id ?? crypto.randomUUID(),
      connectionProfileId: '',
      schemaName,
      tableName,
      columnName,
      text: nextText,
      updatedAt: new Date().toISOString(),
    }
    setAnnotation(key, next)
  }

  return (
    <div className="ml-7 mr-2 my-1 p-2 border border-border rounded bg-muted/30">
      <textarea
        autoFocus
        value={text}
        onChange={handleChange}
        maxLength={500}
        placeholder={`Describe ${columnName ?? tableName}...`}
        aria-label={`Annotation for ${columnName ?? `${schemaName}.${tableName}`}`}
        className="w-full h-20 text-sm bg-background border border-border rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
        <span>{text.length}/500</span>
        <button onClick={onClose} className="px-2 py-0.5 hover:text-foreground">Done</button>
      </div>
    </div>
  )
}

export default AnnotationInput
