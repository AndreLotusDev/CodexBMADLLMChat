import { useAppStore } from '../store/appStore'
import type { PgColumn, PgTable } from '../types'

beforeEach(() => {
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
  })
})

it('setConnectionStatus("connecting") sets status and clears error', () => {
  useAppStore.getState().setConnectionStatus('connecting')
  const { connectionStatus, connectionError } = useAppStore.getState()
  expect(connectionStatus).toBe('connecting')
  expect(connectionError).toBeNull()
})

it('setConnectionStatus("error", msg) sets error message', () => {
  useAppStore.getState().setConnectionStatus('error', 'something went wrong')
  const { connectionStatus, connectionError } = useAppStore.getState()
  expect(connectionStatus).toBe('error')
  expect(connectionError).toBe('something went wrong')
})

it('clearConnection() resets to idle', () => {
  useAppStore.setState({ connectionStatus: 'error', connectionError: 'oops' })
  useAppStore.getState().clearConnection()
  const { connectionStatus, connectionError } = useAppStore.getState()
  expect(connectionStatus).toBe('idle')
  expect(connectionError).toBeNull()
})

it('setSchemaTree(tree) stores the tree', () => {
  const tree = { schemas: [{ name: 'public', tables: [] }] }
  useAppStore.getState().setSchemaTree(tree)
  expect(useAppStore.getState().schemaTree).toEqual(tree)
})

it('clearConnection() resets schemaTree to null', () => {
  useAppStore.setState({ schemaTree: { schemas: [] }, connectionStatus: 'connected', connectionError: null })
  useAppStore.getState().clearConnection()
  expect(useAppStore.getState().schemaTree).toBeNull()
})

it('setSchemaProgress sets progress values', () => {
  useAppStore.getState().setSchemaProgress({ loaded: 5, total: 10 })
  expect(useAppStore.getState().schemaProgress).toEqual({ loaded: 5, total: 10 })
})

it('setSchemaFilter updates schemaFilter', () => {
  useAppStore.getState().setSchemaFilter('users')
  expect(useAppStore.getState().schemaFilter).toBe('users')
})

it('clearConnection() resets schemaFilter to empty string', () => {
  useAppStore.setState({ schemaFilter: 'users' })
  useAppStore.getState().clearConnection()
  expect(useAppStore.getState().schemaFilter).toBe('')
})

describe('selection actions', () => {
  const usersColumns: PgColumn[] = [
    { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
    { name: 'email', dataType: 'text', isNullable: false, isPrimaryKey: false },
  ]
  const ordersColumns: PgColumn[] = [
    { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
    { name: 'user_id', dataType: 'integer', isNullable: false, isPrimaryKey: false },
  ]
  const usersTable: PgTable = {
    schemaName: 'public',
    name: 'users',
    columns: usersColumns,
    primaryKeys: ['id'],
    foreignKeys: [],
  }
  const ordersTable: PgTable = {
    schemaName: 'public',
    name: 'orders',
    columns: ordersColumns,
    primaryKeys: ['id'],
    foreignKeys: [],
  }

  it('toggleTable selects all columns when checking a table', () => {
    useAppStore.getState().toggleTable('public', 'users', usersColumns)
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(true)
    expect(selectedColumns.has('public.users.id')).toBe(true)
    expect(selectedColumns.has('public.users.email')).toBe(true)
  })

  it('toggleTable on an already-selected table removes the table key and all its column keys', () => {
    useAppStore.getState().toggleTable('public', 'users', usersColumns)
    useAppStore.getState().toggleTable('public', 'users', usersColumns)
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(false)
    expect(selectedColumns.has('public.users.id')).toBe(false)
    expect(selectedColumns.has('public.users.email')).toBe(false)
  })

  it('toggleColumn adds the column key when unchecked', () => {
    useAppStore.getState().toggleColumn('public', 'users', 'id')
    const { selectedColumns } = useAppStore.getState()
    expect(selectedColumns.has('public.users.id')).toBe(true)
  })

  it('toggleColumn removes the column key when previously checked', () => {
    useAppStore.getState().toggleColumn('public', 'users', 'id')
    useAppStore.getState().toggleColumn('public', 'users', 'id')
    const { selectedColumns } = useAppStore.getState()
    expect(selectedColumns.has('public.users.id')).toBe(false)
  })

  it('toggleColumn adds the table key when a column is checked (sync rule)', () => {
    useAppStore.getState().toggleColumn('public', 'users', 'id')
    const { selectedTables } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(true)
  })

  it('toggleColumn removes the table key when the last column is unchecked', () => {
    useAppStore.getState().toggleColumn('public', 'users', 'id')
    useAppStore.getState().toggleColumn('public', 'users', 'id')
    const { selectedTables } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(false)
  })

  it('toggleColumn keeps the table key when other columns remain selected', () => {
    useAppStore.getState().toggleTable('public', 'users', usersColumns)
    useAppStore.getState().toggleColumn('public', 'users', 'email')
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(true)
    expect(selectedColumns.has('public.users.id')).toBe(true)
    expect(selectedColumns.has('public.users.email')).toBe(false)
  })

  it('selectAllInSchema populates table keys and column keys for all given tables', () => {
    useAppStore.getState().selectAllInSchema('public', [usersTable, ordersTable])
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(true)
    expect(selectedTables.has('public.orders')).toBe(true)
    expect(selectedColumns.has('public.users.id')).toBe(true)
    expect(selectedColumns.has('public.users.email')).toBe(true)
    expect(selectedColumns.has('public.orders.id')).toBe(true)
    expect(selectedColumns.has('public.orders.user_id')).toBe(true)
  })

  it('selectAllInSchema does not affect tables in other schemas', () => {
    useAppStore.setState({
      selectedTables: new Set(['auth.users']),
      selectedColumns: new Set(['auth.users.id']),
    })
    useAppStore.getState().selectAllInSchema('public', [usersTable])
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('auth.users')).toBe(true)
    expect(selectedColumns.has('auth.users.id')).toBe(true)
    expect(selectedTables.has('public.users')).toBe(true)
  })

  it('deselectAllInSchema removes keys with the schema prefix and leaves other schemas untouched', () => {
    useAppStore.setState({
      selectedTables: new Set(['public.users', 'auth.users']),
      selectedColumns: new Set(['public.users.id', 'auth.users.id']),
    })
    useAppStore.getState().deselectAllInSchema('public')
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(false)
    expect(selectedColumns.has('public.users.id')).toBe(false)
    expect(selectedTables.has('auth.users')).toBe(true)
    expect(selectedColumns.has('auth.users.id')).toBe(true)
  })

  it('clearConnection resets selectedTables and selectedColumns to empty sets', () => {
    useAppStore.setState({
      selectedTables: new Set(['public.users']),
      selectedColumns: new Set(['public.users.id']),
    })
    useAppStore.getState().clearConnection()
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.size).toBe(0)
    expect(selectedColumns.size).toBe(0)
  })
})
