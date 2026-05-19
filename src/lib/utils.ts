// Shared utilities — stub for Story 1.1
// cn() helper (requires clsx + tailwind-merge) added in Story 1.2 with shadcn/ui.

/**
 * Build a stable annotation key.
 * ALWAYS use this — never construct annotation keys inline.
 */
export function buildAnnotationKey(params: {
  connectionId: string
  schemaName: string
  tableName: string
  columnName?: string
}): string {
  const { connectionId, schemaName, tableName, columnName } = params
  const base = `${connectionId}::${schemaName}::${tableName}`
  return columnName ? `${base}::${columnName}` : base
}
