import { describe, it, expect } from 'vitest'
import { generatePrompt } from '../lib/promptGenerator'
import { buildAnnotationKey } from '../lib/utils'
import type { Annotation, SchemaTree } from '../types'

const makeTree = (): SchemaTree => ({
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
            { name: 'created_at', dataType: 'timestamp', isNullable: true, isPrimaryKey: false },
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
            { name: 'total', dataType: 'numeric', isNullable: true, isPrimaryKey: false },
          ],
          primaryKeys: ['id'],
          foreignKeys: [
            {
              constraintName: 'orders_user_id_fkey',
              columnName: 'user_id',
              referencedSchema: 'public',
              referencedTable: 'users',
              referencedColumn: 'id',
            },
          ],
        },
      ],
    },
  ],
})

const makeAnno = (
  schemaName: string,
  tableName: string,
  columnName: string | null,
  text: string,
): Annotation => ({
  id: `anno-${schemaName}-${tableName}-${columnName ?? 'table'}`,
  connectionProfileId: '',
  schemaName,
  tableName,
  columnName,
  text,
  updatedAt: '2026-05-20T00:00:00.000Z',
})

describe('generatePrompt', () => {
  it('returns the empty-selection message when selectedTables is empty', () => {
    const result = generatePrompt(makeTree(), new Set(), new Set(), new Map())
    expect(result.content).toBe('Here is my database schema:\n\n(No tables selected.)\n')
    expect(result.tableCount).toBe(0)
    expect(result.columnCount).toBe(0)
  })

  it('renders one table with all columns selected', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set([
      'public.users.id',
      'public.users.email',
      'public.users.created_at',
    ])
    const result = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(result.content).toContain('Here is my database schema:')
    expect(result.content).toContain('CREATE TABLE public.users (')
    expect(result.content.endsWith(';\n')).toBe(true)
    expect(result.tableCount).toBe(1)
    expect(result.columnCount).toBe(3)
  })

  it('emits NOT NULL only for non-nullable columns', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set([
      'public.users.id',
      'public.users.email',
      'public.users.created_at',
    ])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(content).toMatch(/ {4}id integer NOT NULL,/)
    expect(content).toMatch(/ {4}email text NOT NULL,/)
    expect(content).toMatch(/ {4}created_at timestamp,?/)
    expect(content).not.toMatch(/created_at timestamp NOT NULL/)
  })

  it('emits PRIMARY KEY clause when PK column is selected', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id', 'public.users.email'])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(content).toContain('    PRIMARY KEY (id)')
  })

  it('omits PRIMARY KEY clause when PK column is NOT selected', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.email'])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(content).not.toContain('PRIMARY KEY')
  })

  it('emits FOREIGN KEY clause when source column is selected', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.orders'])
    const selectedColumns = new Set([
      'public.orders.id',
      'public.orders.user_id',
      'public.orders.total',
    ])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(content).toContain('    FOREIGN KEY (user_id) REFERENCES public.users(id)')
  })

  it('omits FOREIGN KEY clause when the source column is deselected', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.orders'])
    const selectedColumns = new Set(['public.orders.id', 'public.orders.total'])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(content).not.toContain('FOREIGN KEY')
  })

  it('emits a single-line column annotation inline with two-space separator', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id', 'public.users.email'])
    const annotations = new Map<string, Annotation>()
    annotations.set(
      buildAnnotationKey('public', 'users', 'email'),
      makeAnno('public', 'users', 'email', 'Used for login'),
    )
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, annotations)
    expect(content).toContain('    email text NOT NULL,  -- Used for login')
  })

  it('emits multi-line column annotation with extra lines BEFORE the column', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.orders'])
    const selectedColumns = new Set([
      'public.orders.id',
      'public.orders.user_id',
      'public.orders.total',
    ])
    const annotations = new Map<string, Annotation>()
    annotations.set(
      buildAnnotationKey('public', 'orders', 'total'),
      makeAnno(
        'public',
        'orders',
        'total',
        'In USD, no tax included\nNegative values are refunds',
      ),
    )
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, annotations)
    expect(content).toContain('    -- Negative values are refunds\n    total numeric,  -- In USD, no tax included')
  })

  it('emits table annotation as -- lines ABOVE CREATE TABLE', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id'])
    const annotations = new Map<string, Annotation>()
    annotations.set(
      buildAnnotationKey('public', 'users', null),
      makeAnno('public', 'users', null, 'Stores all registered users\nincluding soft-deleted'),
    )
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, annotations)
    expect(content).toContain(
      '-- Stores all registered users\n-- including soft-deleted\nCREATE TABLE public.users (',
    )
  })

  it('omits deselected columns entirely (partial selection)', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.email'])
    const { content, columnCount } = generatePrompt(
      tree,
      selectedTables,
      selectedColumns,
      new Map(),
    )
    expect(content).toContain('    email text NOT NULL')
    expect(content).not.toContain('id integer')
    expect(content).not.toContain('created_at')
    expect(columnCount).toBe(1)
  })

  it('trailing comma discipline: last column has no comma when no PK/FK follows', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.email', 'public.users.created_at'])
    // No PK column selected → last entry is created_at column → no comma
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(content).toContain('    email text NOT NULL,\n    created_at timestamp\n);')
  })

  it('trailing comma discipline: PRIMARY KEY is last entry → no trailing comma', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id', 'public.users.email'])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    // id, email columns then PRIMARY KEY (id) as last entry
    expect(content).toContain(
      '    id integer NOT NULL,\n    email text NOT NULL,\n    PRIMARY KEY (id)\n);',
    )
  })

  it('trailing comma discipline: FOREIGN KEY is last entry → no trailing comma', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.orders'])
    const selectedColumns = new Set([
      'public.orders.id',
      'public.orders.user_id',
      'public.orders.total',
    ])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(content).toContain(
      '    PRIMARY KEY (id),\n    FOREIGN KEY (user_id) REFERENCES public.users(id)\n);',
    )
  })

  it('iterates tables in schemaTree order regardless of selectedTables insertion order', () => {
    const tree = makeTree()
    // Insert orders BEFORE users in the Set
    const selectedTables = new Set<string>()
    selectedTables.add('public.orders')
    selectedTables.add('public.users')
    const selectedColumns = new Set([
      'public.users.id',
      'public.orders.id',
    ])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    const usersIdx = content.indexOf('CREATE TABLE public.users')
    const ordersIdx = content.indexOf('CREATE TABLE public.orders')
    expect(usersIdx).toBeGreaterThan(-1)
    expect(ordersIdx).toBeGreaterThan(-1)
    expect(usersIdx).toBeLessThan(ordersIdx)
  })

  it('separates table blocks with exactly one blank line', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users', 'public.orders'])
    const selectedColumns = new Set([
      'public.users.id',
      'public.orders.id',
    ])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    // After the first ');' should be '\n\n' then next CREATE TABLE
    expect(content).toMatch(/\);\n\nCREATE TABLE public\.orders/)
  })

  it('silently skips selection keys that have no matching table in the tree', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users', 'public.nonexistent', 'missingSchema.foo'])
    const selectedColumns = new Set(['public.users.id'])
    const result = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(result.tableCount).toBe(1)
    expect(result.content).toContain('CREATE TABLE public.users')
    expect(result.content).not.toContain('nonexistent')
    expect(result.content).not.toContain('missingSchema')
  })

  it('generatedAt is a valid ISO 8601 string within 1s of current time', () => {
    const before = Date.now()
    const result = generatePrompt(makeTree(), new Set(), new Set(), new Map())
    const after = Date.now()
    const parsed = new Date(result.generatedAt).getTime()
    expect(Number.isNaN(parsed)).toBe(false)
    // Parsed time should be between before and after (allow 1s slack on either side)
    expect(parsed).toBeGreaterThanOrEqual(before - 1000)
    expect(parsed).toBeLessThanOrEqual(after + 1000)
  })

  it('prepends the query block when query is non-empty', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id'])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map(), 'Show me the users.', '')
    expect(content.startsWith('Show me the users.\n\nHere is my database schema:')).toBe(true)
  })

  it('appends the expected-output block when expectedOutput is non-empty', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id'])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map(), '', 'A single SELECT.')
    expect(content).toContain('\n\nExpected output:\nA single SELECT.\n')
    expect(content.endsWith('Expected output:\nA single SELECT.\n')).toBe(true)
  })

  it('weaves both query and expectedOutput around the schema', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id'])
    const { content } = generatePrompt(tree, selectedTables, selectedColumns, new Map(), 'Q', 'O')
    expect(content).toMatch(/^Q\n\nHere is my database schema:[\s\S]+;\n\nExpected output:\nO\n$/)
  })

  it('whitespace-only query and expectedOutput collapse out', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users'])
    const selectedColumns = new Set(['public.users.id'])
    const { content: empty } = generatePrompt(tree, selectedTables, selectedColumns, new Map(), '   \n\n', '\t')
    const { content: noArgs } = generatePrompt(tree, selectedTables, selectedColumns, new Map())
    expect(empty).toBe(noArgs)
  })

  // Worked-example covers the schema-only baseline; Q/O weaving is covered by the four tests immediately above.
  it('matches the worked-example output verbatim', () => {
    const tree = makeTree()
    const selectedTables = new Set(['public.users', 'public.orders'])
    const selectedColumns = new Set([
      'public.users.id',
      'public.users.email',
      'public.orders.id',
      'public.orders.user_id',
      'public.orders.total',
    ])
    const annotations = new Map<string, Annotation>()
    annotations.set(
      buildAnnotationKey('public', 'users', null),
      makeAnno('public', 'users', null, 'Stores all registered users'),
    )
    annotations.set(
      buildAnnotationKey('public', 'users', 'email'),
      makeAnno('public', 'users', 'email', 'Used for login and notifications'),
    )
    annotations.set(
      buildAnnotationKey('public', 'orders', 'total'),
      makeAnno(
        'public',
        'orders',
        'total',
        'In USD, no tax included\nNegative values are refunds',
      ),
    )
    const expected =
      'Here is my database schema:\n' +
      '\n' +
      '-- Stores all registered users\n' +
      'CREATE TABLE public.users (\n' +
      '    id integer NOT NULL,\n' +
      '    email text NOT NULL,  -- Used for login and notifications\n' +
      '    PRIMARY KEY (id)\n' +
      ');\n' +
      '\n' +
      'CREATE TABLE public.orders (\n' +
      '    id integer NOT NULL,\n' +
      '    user_id integer NOT NULL,\n' +
      '    -- Negative values are refunds\n' +
      '    total numeric,  -- In USD, no tax included\n' +
      '    PRIMARY KEY (id),\n' +
      '    FOREIGN KEY (user_id) REFERENCES public.users(id)\n' +
      ');\n'
    const result = generatePrompt(tree, selectedTables, selectedColumns, annotations)
    expect(result.content).toBe(expected)
    expect(result.tableCount).toBe(2)
    expect(result.columnCount).toBe(5)
  })
})
