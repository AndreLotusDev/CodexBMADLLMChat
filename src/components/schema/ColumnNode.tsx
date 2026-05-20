import { FC, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import type { PgColumn } from '../../types'
import { useAppStore } from '../../store/appStore'
import { cn, buildAnnotationKey } from '../../lib/utils'
import { Checkbox } from '../ui/checkbox'
import HighlightedText from './HighlightedText'
import AnnotationInput from './AnnotationInput'

interface ColumnNodeProps {
  column: PgColumn
  schemaName: string
  tableName: string
  query?: string
}

const ColumnNode: FC<ColumnNodeProps> = ({ column, schemaName, tableName, query = '' }) => {
  const [annotating, setAnnotating] = useState(false)
  const selectedColumns = useAppStore(s => s.selectedColumns)
  const toggleColumn = useAppStore(s => s.toggleColumn)
  const annotations = useAppStore(s => s.annotations)

  const columnKey = `${schemaName}.${tableName}.${column.name}`
  const isChecked = selectedColumns.has(columnKey)

  const annotationKey = buildAnnotationKey(schemaName, tableName, column.name)
  const hasAnnotation = annotations.has(annotationKey)

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-0.5 text-sm text-muted-foreground font-mono">
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => toggleColumn(schemaName, tableName, column.name)}
          aria-label={`Select column ${column.name}`}
        />
        {column.isPrimaryKey && (
          <span className="text-yellow-500 font-bold text-xs">PK</span>
        )}
        <span className="text-foreground">
          <HighlightedText text={column.name} query={query} />
        </span>
        <span className="text-xs">{column.dataType}</span>
        {column.isNullable && (
          <span className="text-xs text-muted-foreground">?</span>
        )}
        {column.foreignKeyRef && (
          <span className="text-xs text-blue-400">
            → {column.foreignKeyRef.schema}.{column.foreignKeyRef.table}.{column.foreignKeyRef.column}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setAnnotating(v => !v) }}
          aria-label={hasAnnotation ? `Edit annotation for ${column.name}` : `Add annotation to ${column.name}`}
          className={cn(
            'shrink-0 ml-auto p-1 rounded hover:text-foreground',
            hasAnnotation ? 'text-yellow-500' : 'text-muted-foreground/60',
          )}
        >
          <MessageSquareText size={14} />
        </button>
      </div>
      {annotating && (
        <AnnotationInput
          schemaName={schemaName}
          tableName={tableName}
          columnName={column.name}
          onClose={() => setAnnotating(false)}
        />
      )}
    </div>
  )
}

export default ColumnNode
