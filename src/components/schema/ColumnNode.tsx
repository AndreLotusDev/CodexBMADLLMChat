import { FC } from 'react'
import type { PgColumn } from '../../types'
import { useAppStore } from '../../store/appStore'
import { Checkbox } from '../ui/checkbox'
import HighlightedText from './HighlightedText'

interface ColumnNodeProps {
  column: PgColumn
  schemaName: string
  tableName: string
  query?: string
}

const ColumnNode: FC<ColumnNodeProps> = ({ column, schemaName, tableName, query = '' }) => {
  const selectedColumns = useAppStore(s => s.selectedColumns)
  const toggleColumn = useAppStore(s => s.toggleColumn)

  const columnKey = `${schemaName}.${tableName}.${column.name}`
  const isChecked = selectedColumns.has(columnKey)

  return (
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
    </div>
  )
}

export default ColumnNode
