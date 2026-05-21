import type { Annotation, PromptBlock, SchemaTree } from '../types'
import { buildAnnotationKey } from './utils'

type Entry =
  | { kind: 'comment'; text: string }
  | { kind: 'data'; text: string; inlineComment?: string }

const EMPTY_CONTENT = 'Here is my database schema:\n\n(No tables selected.)\n'

export function generatePrompt(
  schemaTree: SchemaTree,
  selectedTables: Set<string>,
  selectedColumns: Set<string>,
  annotations: Map<string, Annotation>,
  query: string = '',
  expectedOutput: string = '',
): PromptBlock {
  const generatedAt = new Date().toISOString()

  if (selectedTables.size === 0) {
    return { content: EMPTY_CONTENT, tableCount: 0, columnCount: 0, generatedAt }
  }

  const blocks: string[] = []
  let tableCount = 0
  let columnCount = 0

  for (const schema of schemaTree.schemas) {
    for (const table of schema.tables) {
      const tableKey = `${schema.name}.${table.name}`
      if (!selectedTables.has(tableKey)) continue

      tableCount += 1

      const entries: Entry[] = []

      for (const col of table.columns) {
        const colSelectionKey = `${tableKey}.${col.name}`
        if (!selectedColumns.has(colSelectionKey)) continue

        columnCount += 1
        const decl = `${col.name} ${col.dataType}${col.isNullable === false ? ' NOT NULL' : ''}`
        const annoKey = buildAnnotationKey(schema.name, table.name, col.name)
        const anno = annotations.get(annoKey)
        if (anno && anno.text.length > 0) {
          const lines = anno.text.split('\n')
          const first = lines[0]
          const rest = lines.slice(1)
          for (const extra of rest) {
            entries.push({ kind: 'comment', text: extra })
          }
          entries.push({ kind: 'data', text: decl, inlineComment: first })
        } else {
          entries.push({ kind: 'data', text: decl })
        }
      }

      const selectedPks = table.primaryKeys.filter((pk) =>
        selectedColumns.has(`${tableKey}.${pk}`),
      )
      if (selectedPks.length > 0) {
        entries.push({ kind: 'data', text: `PRIMARY KEY (${selectedPks.join(', ')})` })
      }

      for (const fk of table.foreignKeys) {
        if (!selectedColumns.has(`${tableKey}.${fk.columnName}`)) continue
        entries.push({
          kind: 'data',
          text: `FOREIGN KEY (${fk.columnName}) REFERENCES ${fk.referencedSchema}.${fk.referencedTable}(${fk.referencedColumn})`,
        })
      }

      let lastDataIdx = -1
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].kind === 'data') {
          lastDataIdx = i
          break
        }
      }

      const lines: string[] = []

      const tableAnnoKey = buildAnnotationKey(schema.name, table.name, null)
      const tableAnno = annotations.get(tableAnnoKey)
      if (tableAnno && tableAnno.text.length > 0) {
        for (const ln of tableAnno.text.split('\n')) {
          lines.push(`-- ${ln}`)
        }
      }

      lines.push(`CREATE TABLE ${schema.name}.${table.name} (`)

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (entry.kind === 'comment') {
          lines.push(`    -- ${entry.text}`)
        } else {
          const comma = i < lastDataIdx ? ',' : ''
          const inline = entry.inlineComment ? `  -- ${entry.inlineComment}` : ''
          lines.push(`    ${entry.text}${comma}${inline}`)
        }
      }

      lines.push(');')

      blocks.push(lines.join('\n'))
    }
  }

  const schemaContent =
    blocks.length === 0
      ? EMPTY_CONTENT
      : `Here is my database schema:\n\n${blocks.join('\n\n')}\n`

  const trimmedQuery = query.trim()
  const trimmedOutput = expectedOutput.trim()

  const parts: string[] = []
  if (trimmedQuery !== '') parts.push(trimmedQuery + '\n')
  parts.push(schemaContent)
  if (trimmedOutput !== '') parts.push(`Expected output:\n${trimmedOutput}\n`)

  const content = parts.join('\n')

  return { content, tableCount, columnCount, generatedAt }
}
