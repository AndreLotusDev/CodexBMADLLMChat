import { FC, useMemo } from 'react'
import type { SchemaTree as SchemaTreeData } from '../../types'
import { useAppStore } from '../../store/appStore'
import { filterSchemaTree } from '../../lib/filterSchemaTree'
import SchemaNode from './SchemaNode'

const SchemaTree: FC<{ tree: SchemaTreeData }> = ({ tree }) => {
  const schemaFilter = useAppStore(s => s.schemaFilter)

  const filtered = useMemo(
    () => filterSchemaTree(tree, schemaFilter),
    [tree, schemaFilter],
  )

  if (tree.schemas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4">No schemas found in this database.</p>
    )
  }

  if (filtered.schemas.length === 0 && schemaFilter.trim() !== '') {
    return (
      <p className="text-sm text-muted-foreground p-4">
        No tables or columns match &quot;{schemaFilter}&quot;
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {filtered.schemas.map(schema => (
        <SchemaNode key={schema.name} schema={schema} query={schemaFilter} />
      ))}
    </div>
  )
}

export default SchemaTree
