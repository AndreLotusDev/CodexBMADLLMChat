import { FC, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { PgSchema } from '../../types'
import { useAppStore } from '../../store/appStore'
import TableNode from './TableNode'

const SchemaNode: FC<{ schema: PgSchema; query?: string }> = ({ schema, query = '' }) => {
  const [expanded, setExpanded] = useState(true)
  const selectAllInSchema = useAppStore(s => s.selectAllInSchema)
  const deselectAllInSchema = useAppStore(s => s.deselectAllInSchema)

  const hasTables = schema.tables.length > 0

  return (
    <div>
      <div className="flex items-center gap-1.5 w-full px-2 py-1 text-sm font-semibold hover:bg-accent rounded">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{schema.name}</span>
          <span className="text-xs text-muted-foreground font-normal ml-1">({schema.tables.length} tables)</span>
        </button>
        <button
          onClick={() => selectAllInSchema(schema.name, schema.tables)}
          disabled={!hasTables}
          className="text-xs text-muted-foreground hover:text-foreground px-1 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select all
        </button>
        <button
          onClick={() => deselectAllInSchema(schema.name)}
          className="text-xs text-muted-foreground hover:text-foreground px-1 font-normal"
        >
          Deselect all
        </button>
      </div>
      {expanded && (
        <div className="ml-4">
          {schema.tables.map(table => (
            <TableNode key={`${schema.name}.${table.name}`} table={table} query={query} />
          ))}
        </div>
      )}
    </div>
  )
}

export default SchemaNode
