import { describe, expect, it } from 'vitest'
import { filterSchemaTree } from '../lib/filterSchemaTree'
import type { SchemaTree } from '../types'

const mockTree: SchemaTree = {
  schemas: [
    {
      name: 'public',
      tables: [
        {
          schemaName: 'public',
          name: 'users',
          columns: [
            { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
            { name: 'email', dataType: 'text', isNullable: false, isPrimaryKey: false },
          ],
          primaryKeys: ['id'],
          foreignKeys: [],
        },
        {
          schemaName: 'public',
          name: 'orders',
          columns: [
            { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
            { name: 'user_id', dataType: 'integer', isNullable: false, isPrimaryKey: false },
          ],
          primaryKeys: ['id'],
          foreignKeys: [],
        },
      ],
    },
    {
      name: 'auth',
      tables: [
        {
          schemaName: 'auth',
          name: 'sessions',
          columns: [
            { name: 'token', dataType: 'text', isNullable: false, isPrimaryKey: true },
          ],
          primaryKeys: ['token'],
          foreignKeys: [],
        },
      ],
    },
  ],
}

describe('filterSchemaTree', () => {
  it('returns the original tree unchanged when query is empty', () => {
    const result = filterSchemaTree(mockTree, '')
    expect(result).toBe(mockTree)
  })

  it('returns the original tree unchanged when query is only whitespace', () => {
    const result = filterSchemaTree(mockTree, '   ')
    expect(result).toBe(mockTree)
  })

  it('keeps a table with all columns when its name matches', () => {
    const result = filterSchemaTree(mockTree, 'users')
    expect(result.schemas).toHaveLength(1)
    expect(result.schemas[0].name).toBe('public')
    expect(result.schemas[0].tables).toHaveLength(1)
    expect(result.schemas[0].tables[0].name).toBe('users')
    expect(result.schemas[0].tables[0].columns).toHaveLength(2)
  })

  it('keeps only matching columns when only column names match', () => {
    const result = filterSchemaTree(mockTree, 'user_id')
    expect(result.schemas).toHaveLength(1)
    expect(result.schemas[0].tables).toHaveLength(1)
    expect(result.schemas[0].tables[0].name).toBe('orders')
    expect(result.schemas[0].tables[0].columns).toHaveLength(1)
    expect(result.schemas[0].tables[0].columns[0].name).toBe('user_id')
  })

  it('matches case-insensitively', () => {
    const result = filterSchemaTree(mockTree, 'USER')
    expect(result.schemas).toHaveLength(1)
    const tableNames = result.schemas[0].tables.map(t => t.name).sort()
    expect(tableNames).toEqual(['orders', 'users'])
  })

  it('omits schemas whose tables all fail to match', () => {
    const result = filterSchemaTree(mockTree, 'users')
    const schemaNames = result.schemas.map(s => s.name)
    expect(schemaNames).not.toContain('auth')
  })

  it('does not mutate the input tree', () => {
    const before = JSON.stringify(mockTree)
    filterSchemaTree(mockTree, 'user_id')
    const after = JSON.stringify(mockTree)
    expect(after).toBe(before)
  })

  it('returns an empty schemas list when nothing matches', () => {
    const result = filterSchemaTree(mockTree, 'zzz_no_match')
    expect(result.schemas).toHaveLength(0)
  })
})
