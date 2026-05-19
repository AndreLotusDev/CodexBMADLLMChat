import { FC, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { PgTable } from '../../types'
import ColumnNode from './ColumnNode'

const TableNode: FC<{ table: PgTable; defaultExpanded?: boolean }> = ({ table, defaultExpanded }) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-sm hover:bg-accent rounded text-left"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium">{table.name}</span>
        <span className="text-xs text-muted-foreground ml-1">({table.columns.length})</span>
      </button>
      {expanded && (
        <div className="ml-4 border-l border-border">
          {table.columns.map(col => (
            <ColumnNode key={col.name} column={col} />
          ))}
        </div>
      )}
    </div>
  )
}

export default TableNode
