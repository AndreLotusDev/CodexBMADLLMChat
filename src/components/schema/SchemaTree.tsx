import { FC } from 'react'
import type { SchemaTree as SchemaTreeData } from '../../types'
import SchemaNode from './SchemaNode'

const SchemaTree: FC<{ tree: SchemaTreeData }> = ({ tree }) => {
  if (tree.schemas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground p-4">No schemas found in this database.</p>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {tree.schemas.map(schema => (
        <SchemaNode key={schema.name} schema={schema} />
      ))}
    </div>
  )
}

export default SchemaTree
