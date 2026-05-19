import { useAppStore } from '../store/appStore'

beforeEach(() => {
  useAppStore.setState({ connectionStatus: 'idle', connectionError: null })
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
