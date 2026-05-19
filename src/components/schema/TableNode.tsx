import { FC, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { PgTable } from '../../types'
import ColumnNode from './ColumnNode'
import HighlightedText from './HighlightedText'

const TableNode: FC<{ table: PgTable; defaultExpanded?: boolean; query?: string }> = ({
  table,
  defaultExpanded,
  query = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const isOpen = query.trim() !== '' || expanded

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-sm hover:bg-accent rounded text-left"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium">
          <HighlightedText text={table.name} query={query} />
        </span>
        <span className="text-xs text-muted-foreground ml-1">({table.columns.length})</span>
      </button>
      {isOpen && (
        <div className="ml-4 border-l border-border">
          {table.columns.map(col => (
            <ColumnNode key={col.name} column={col} query={query} />
          ))}
        </div>
      )}
    </div>
  )
}

export default TableNode
