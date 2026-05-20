import { FC, useState } from 'react'
import { ChevronRight, ChevronDown, MessageSquareText } from 'lucide-react'
import type { PgTable } from '../../types'
import { useAppStore } from '../../store/appStore'
import { cn, buildAnnotationKey } from '../../lib/utils'
import { Checkbox } from '../ui/checkbox'
import ColumnNode from './ColumnNode'
import HighlightedText from './HighlightedText'
import AnnotationInput from './AnnotationInput'

const TableNode: FC<{ table: PgTable; defaultExpanded?: boolean; query?: string }> = ({
  table,
  defaultExpanded,
  query = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const [annotating, setAnnotating] = useState(false)
  const isOpen = query.trim() !== '' || expanded

  const selectedTables = useAppStore(s => s.selectedTables)
  const selectedColumns = useAppStore(s => s.selectedColumns)
  const toggleTable = useAppStore(s => s.toggleTable)
  const annotations = useAppStore(s => s.annotations)

  const tableKey = `${table.schemaName}.${table.name}`
  const selectedColCount = table.columns.filter(c =>
    selectedColumns.has(`${tableKey}.${c.name}`),
  ).length
  const isChecked =
    selectedTables.has(tableKey) && selectedColCount === table.columns.length
  const isIndeterminate =
    selectedColCount > 0 && selectedColCount < table.columns.length

  const annotationKey = buildAnnotationKey(table.schemaName, table.name, null)
  const hasAnnotation = annotations.has(annotationKey)

  return (
    <div>
      <div className="flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-accent rounded">
        <Checkbox
          checked={isChecked}
          indeterminate={isIndeterminate}
          onCheckedChange={() => toggleTable(table.schemaName, table.name, table.columns)}
          aria-label={`Select table ${table.name}`}
        />
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-medium">
            <HighlightedText text={table.name} query={query} />
          </span>
          <span className="text-xs text-muted-foreground ml-1">({table.columns.length})</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setAnnotating(v => !v) }}
          aria-label={hasAnnotation ? `Edit annotation for ${table.name}` : `Add annotation to ${table.name}`}
          className={cn(
            'shrink-0 p-1 rounded hover:text-foreground',
            hasAnnotation ? 'text-yellow-500' : 'text-muted-foreground/60',
          )}
        >
          <MessageSquareText size={14} />
        </button>
      </div>
      {annotating && (
        <AnnotationInput
          schemaName={table.schemaName}
          tableName={table.name}
          columnName={null}
          onClose={() => setAnnotating(false)}
        />
      )}
      {isOpen && (
        <div className="ml-4 border-l border-border">
          {table.columns.map(col => (
            <ColumnNode
              key={col.name}
              column={col}
              schemaName={table.schemaName}
              tableName={table.name}
              query={query}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TableNode
