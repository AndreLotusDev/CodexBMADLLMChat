import { FC, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { PgSchema } from '../../types'
import TableNode from './TableNode'

const SchemaNode: FC<{ schema: PgSchema }> = ({ schema }) => {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-sm font-semibold hover:bg-accent rounded text-left"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{schema.name}</span>
        <span className="text-xs text-muted-foreground font-normal ml-1">({schema.tables.length} tables)</span>
      </button>
      {expanded && (
        <div className="ml-4">
          {schema.tables.map(table => (
            <TableNode key={`${schema.name}.${table.name}`} table={table} />
          ))}
        </div>
      )}
    </div>
  )
}

export default SchemaNode
