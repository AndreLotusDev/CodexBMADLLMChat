import { useAppStore } from '../store/appStore'
import type { Annotation, ConnectionProfile, PgColumn, PgTable, PromptBlock } from '../types'

beforeEach(() => {
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
    annotations: new Map<string, Annotation>(),
    prompt: null,
    isGenerating: false,
    savedProfiles: [],
    activeProfile: null,
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

describe('annotation actions', () => {
  const makeAnno = (overrides: Partial<Annotation> = {}): Annotation => ({
    id: 'anno-1',
    connectionProfileId: '',
    schemaName: 'public',
    tableName: 'users',
    columnName: null,
    text: 'a table annotation',
    updatedAt: '2026-05-19T00:00:00.000Z',
    ...overrides,
  })

  it('setAnnotation adds the entry and round-trips text + updatedAt', () => {
    const anno = makeAnno({ text: 'first', updatedAt: '2026-05-19T01:00:00.000Z' })
    useAppStore.getState().setAnnotation('public.users.', anno)
    const stored = useAppStore.getState().annotations.get('public.users.')
    expect(stored).toBeDefined()
    expect(stored?.text).toBe('first')
    expect(stored?.updatedAt).toBe('2026-05-19T01:00:00.000Z')
  })

  it('setAnnotation overwrites a prior entry under the same key (Map size stays 1)', () => {
    useAppStore.getState().setAnnotation('public.users.', makeAnno({ text: 'first' }))
    useAppStore.getState().setAnnotation('public.users.', makeAnno({ text: 'second' }))
    const { annotations } = useAppStore.getState()
    expect(annotations.size).toBe(1)
    expect(annotations.get('public.users.')?.text).toBe('second')
  })

  it('removeAnnotation deletes the entry', () => {
    useAppStore.getState().setAnnotation('public.users.', makeAnno())
    useAppStore.getState().removeAnnotation('public.users.')
    expect(useAppStore.getState().annotations.has('public.users.')).toBe(false)
  })

  it('removeAnnotation on a missing key is a no-op', () => {
    const before = useAppStore.getState().annotations
    useAppStore.getState().removeAnnotation('public.does_not_exist.')
    const after = useAppStore.getState().annotations
    expect(after.size).toBe(0)
    expect(after).toBe(before)
  })

  it('clearConnection resets annotations to an empty Map', () => {
    useAppStore.setState({
      annotations: new Map([['public.users.', makeAnno()]]),
    })
    useAppStore.getState().clearConnection()
    expect(useAppStore.getState().annotations.size).toBe(0)
  })

  it('setAnnotations replaces the existing map and builds keys via buildAnnotationKey', () => {
    useAppStore.getState().setAnnotation('public.users.', makeAnno({ id: 'old-a' }))
    useAppStore.getState().setAnnotation(
      'public.orders.',
      makeAnno({ id: 'old-b', tableName: 'orders' }),
    )

    const incoming = makeAnno({
      id: 'new-id',
      schemaName: 'public',
      tableName: 'users',
      columnName: 'email',
      text: 'fresh from db',
    })
    useAppStore.getState().setAnnotations([incoming])

    const { annotations } = useAppStore.getState()
    expect(annotations.size).toBe(1)
    expect(annotations.get('public.users.email')?.id).toBe('new-id')
    expect(annotations.get('public.users.email')?.text).toBe('fresh from db')
    // Old entries are gone (replacement semantics, not merge).
    expect(annotations.has('public.users.')).toBe(false)
    expect(annotations.has('public.orders.')).toBe(false)
  })

  it('setAnnotations([]) clears the map', () => {
    useAppStore.setState({
      annotations: new Map([['public.users.', makeAnno()]]),
    })
    useAppStore.getState().setAnnotations([])
    expect(useAppStore.getState().annotations.size).toBe(0)
  })
})

describe('query / expectedOutput actions', () => {
  it('setQuery updates the query field', () => {
    useAppStore.getState().setQuery('**bold**')
    expect(useAppStore.getState().query).toBe('**bold**')
  })

  it('setExpectedOutput updates the expectedOutput field', () => {
    useAppStore.getState().setExpectedOutput('A single SELECT.')
    expect(useAppStore.getState().expectedOutput).toBe('A single SELECT.')
  })

  it('clearConnection resets query and expectedOutput', () => {
    useAppStore.getState().setQuery('some query')
    useAppStore.getState().setExpectedOutput('some output')
    useAppStore.getState().clearConnection()
    expect(useAppStore.getState().query).toBe('')
    expect(useAppStore.getState().expectedOutput).toBe('')
  })
})

describe('prompt actions', () => {
  const sample: PromptBlock = {
    content: 'Here is my database schema:\n\nCREATE TABLE x ();\n',
    tableCount: 1,
    columnCount: 0,
    generatedAt: '2026-05-20T00:00:00.000Z',
  }

  it('setPrompt(block) stores the prompt', () => {
    useAppStore.getState().setPrompt(sample)
    expect(useAppStore.getState().prompt).toEqual(sample)
  })

  it('setPrompt(null) clears the prompt', () => {
    useAppStore.getState().setPrompt(sample)
    useAppStore.getState().setPrompt(null)
    expect(useAppStore.getState().prompt).toBeNull()
  })

  it('setIsGenerating toggles the flag', () => {
    useAppStore.getState().setIsGenerating(true)
    expect(useAppStore.getState().isGenerating).toBe(true)
    useAppStore.getState().setIsGenerating(false)
    expect(useAppStore.getState().isGenerating).toBe(false)
  })

  it('clearConnection resets prompt to null and isGenerating to false', () => {
    useAppStore.setState({ prompt: sample, isGenerating: true })
    useAppStore.getState().clearConnection()
    expect(useAppStore.getState().prompt).toBeNull()
    expect(useAppStore.getState().isGenerating).toBe(false)
  })
})

describe('profiles slice', () => {
  const fixtureA: ConnectionProfile = {
    id: 'profile-a-id',
    name: 'Prod DB',
    host: 'prod.example.com',
    port: 5432,
    database: 'app',
    username: 'postgres',
    createdAt: '2026-05-20T00:00:00Z',
  }
  const fixtureB: ConnectionProfile = {
    id: 'profile-b-id',
    name: 'Staging',
    host: 'stage.example.com',
    port: 5432,
    database: 'app',
    username: 'postgres',
    createdAt: '2026-05-20T01:00:00Z',
  }

  it('setSavedProfiles writes the list to the store', () => {
    useAppStore.getState().setSavedProfiles([fixtureA, fixtureB])
    expect(useAppStore.getState().savedProfiles).toEqual([fixtureA, fixtureB])
  })

  it('setActiveProfile(profile) sets the active profile', () => {
    useAppStore.getState().setActiveProfile(fixtureA)
    expect(useAppStore.getState().activeProfile).toEqual(fixtureA)
  })

  it('setActiveProfile(null) clears the active profile', () => {
    useAppStore.setState({ activeProfile: fixtureA })
    useAppStore.getState().setActiveProfile(null)
    expect(useAppStore.getState().activeProfile).toBeNull()
  })

  it('addSavedProfile appends to the existing list (does NOT replace)', () => {
    useAppStore.setState({ savedProfiles: [fixtureA] })
    useAppStore.getState().addSavedProfile(fixtureB)
    expect(useAppStore.getState().savedProfiles).toEqual([fixtureA, fixtureB])
  })

  it('removeSavedProfile filters by id', () => {
    useAppStore.setState({ savedProfiles: [fixtureA, fixtureB] })
    useAppStore.getState().removeSavedProfile(fixtureA.id)
    expect(useAppStore.getState().savedProfiles).toEqual([fixtureB])
  })

  it('removeSavedProfile clears activeProfile when the removed id matches', () => {
    useAppStore.setState({ savedProfiles: [fixtureA, fixtureB], activeProfile: fixtureA })
    useAppStore.getState().removeSavedProfile(fixtureA.id)
    expect(useAppStore.getState().activeProfile).toBeNull()
  })

  it('removeSavedProfile leaves activeProfile unchanged when ids do NOT match', () => {
    useAppStore.setState({ savedProfiles: [fixtureA, fixtureB], activeProfile: fixtureA })
    useAppStore.getState().removeSavedProfile(fixtureB.id)
    expect(useAppStore.getState().activeProfile).toEqual(fixtureA)
  })

  it('clearConnection resets activeProfile to null but LEAVES savedProfiles intact', () => {
    useAppStore.setState({ savedProfiles: [fixtureA, fixtureB], activeProfile: fixtureA })
    useAppStore.getState().clearConnection()
    expect(useAppStore.getState().activeProfile).toBeNull()
    expect(useAppStore.getState().savedProfiles).toEqual([fixtureA, fixtureB])
  })

  it('renameSavedProfile updates the matching profile name in savedProfiles', () => {
    useAppStore.setState({ savedProfiles: [fixtureA, fixtureB] })
    useAppStore.getState().renameSavedProfile(fixtureA.id, 'Renamed')
    const { savedProfiles } = useAppStore.getState()
    expect(savedProfiles[0].name).toBe('Renamed')
    expect(savedProfiles[1].name).toBe(fixtureB.name)
  })

  it('renameSavedProfile also updates activeProfile when it matches the renamed id', () => {
    useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: fixtureA })
    useAppStore.getState().renameSavedProfile(fixtureA.id, 'Renamed')
    expect(useAppStore.getState().activeProfile?.name).toBe('Renamed')
  })

  it('renameSavedProfile does NOT touch activeProfile when a different profile is renamed', () => {
    useAppStore.setState({ savedProfiles: [fixtureA, fixtureB], activeProfile: fixtureB })
    useAppStore.getState().renameSavedProfile(fixtureA.id, 'Renamed')
    expect(useAppStore.getState().activeProfile?.name).toBe(fixtureB.name)
  })

  it('renameSavedProfile is a no-op when no profile matches the id', () => {
    useAppStore.setState({ savedProfiles: [fixtureA, fixtureB] })
    useAppStore.getState().renameSavedProfile('ghost-id', 'Whatever')
    const { savedProfiles } = useAppStore.getState()
    expect(savedProfiles[0].name).toBe(fixtureA.name)
    expect(savedProfiles[1].name).toBe(fixtureB.name)
  })
})
