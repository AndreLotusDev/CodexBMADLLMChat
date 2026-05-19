import type { PgSchema, PgTable, SchemaTree } from '../types'

export function filterSchemaTree(tree: SchemaTree, query: string): SchemaTree {
  if (query.trim() === '') return tree

  const q = query.trim().toLowerCase()
  const filteredSchemas: PgSchema[] = []

  for (const schema of tree.schemas) {
    const survivingTables: PgTable[] = []

    for (const table of schema.tables) {
      if (table.name.toLowerCase().includes(q)) {
        survivingTables.push({
          ...table,
          columns: [...table.columns],
        })
        continue
      }

      const matchingColumns = table.columns.filter(col =>
        col.name.toLowerCase().includes(q),
      )

      if (matchingColumns.length > 0) {
        survivingTables.push({
          ...table,
          columns: matchingColumns,
        })
      }
    }

    if (survivingTables.length > 0) {
      filteredSchemas.push({
        ...schema,
        tables: survivingTables,
      })
    }
  }

  return { schemas: filteredSchemas }
}
