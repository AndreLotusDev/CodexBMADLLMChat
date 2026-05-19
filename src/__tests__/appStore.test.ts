import { useAppStore } from '../store/appStore'

beforeEach(() => {
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
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
