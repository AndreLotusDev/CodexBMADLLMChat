import { FC } from 'react'
import type { PgColumn } from '../../types'
import HighlightedText from './HighlightedText'

const ColumnNode: FC<{ column: PgColumn; query?: string }> = ({ column, query = '' }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-0.5 text-sm text-muted-foreground font-mono">
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
