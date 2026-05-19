import { FC } from 'react'
import type { PgColumn } from '../../types'

const ColumnNode: FC<{ column: PgColumn }> = ({ column }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-0.5 text-sm text-muted-foreground font-mono">
      {column.isPrimaryKey && (
        <span className="text-yellow-500 font-bold text-xs">PK</span>
      )}
      <span className="text-foreground">{column.name}</span>
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
