import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { invoke } from '@tauri-apps/api/core'
import ConnectionForm from '../components/connection/ConnectionForm'
import { useAppStore } from '../store/appStore'
import type { ConnectionProfile } from '../types'

const mockInvoke = invoke as ReturnType<typeof vi.fn>

const fixtureA: ConnectionProfile = {
  id: 'profile-a-id',
  name: 'Prod DB',
  host: 'prod.example.com',
  port: 5433,
  database: 'app',
  username: 'admin',
  createdAt: '2026-05-20T00:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
  // Default routing: list_profiles always resolves to []. Once-mocks via mockResolvedValueOnce
  // are consumed FIFO BEFORE this default — order matters and tests that queue results must
  // account for the mount-time list_profiles call.
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_profiles') return []
    return undefined
  })
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    savedProfiles: [],
    activeProfile: null,
  })
})

const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/host/i), { target: { value: 'localhost' } })
  fireEvent.change(screen.getByLabelText(/port/i), { target: { value: '5432' } })
  fireEvent.change(screen.getByLabelText(/database/i), { target: { value: 'mydb' } })
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'postgres' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
}

it('renders all 5 form fields', () => {
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  expect(screen.getByLabelText(/host/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/port/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/database/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  expect(screen.getByLabelText('Password')).toBeInTheDocument()
})

it('Test Connection button is disabled when fields are empty', () => {
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled()
})

it('Test Connection button is enabled when all fields are filled', () => {
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  fillForm()
  expect(screen.getByRole('button', { name: /test connection/i })).not.toBeDisabled()
})

it('password field is masked by default, toggles to text on show button click', () => {
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  const passwordInput = screen.getByLabelText('Password')
  expect(passwordInput).toHaveAttribute('type', 'password')
  fireEvent.click(screen.getByRole('button', { name: /show password/i }))
  expect(passwordInput).toHaveAttribute('type', 'text')
})

it('password toggle is bidirectional: text reverts to password on second click', () => {
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  const passwordInput = screen.getByLabelText('Password')
  fireEvent.click(screen.getByRole('button', { name: /show password/i }))
  expect(passwordInput).toHaveAttribute('type', 'text')
  fireEvent.click(screen.getByRole('button', { name: /hide password/i }))
  expect(passwordInput).toHaveAttribute('type', 'password')
})

it('button shows "Testing…" text while connecting', async () => {
  let resolve: (v: undefined) => void
  const pending = new Promise<undefined>(r => { resolve = r })
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_profiles') return []
    if (cmd === 'test_connection') return pending
    return undefined
  })
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  fillForm()
  fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /testing/i })).toBeInTheDocument()
  })
  resolve!(undefined)
})

it('shows success banner when invoke resolves', async () => {
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_profiles') return []
    if (cmd === 'test_connection') return undefined
    return undefined
  })
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  fillForm()
  fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
  await waitFor(() => {
    expect(screen.getByText(/connection successful/i)).toBeInTheDocument()
  })
})

it('shows error banner when invoke rejects with TauriCommandError', async () => {
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_profiles') return []
    if (cmd === 'test_connection') {
      throw { code: 'AuthFailed', message: 'Authentication failed. Check your username and password.' }
    }
    return undefined
  })
  render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
  fillForm()
  fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
  await waitFor(() => {
    expect(
      screen.getByText('Authentication failed. Check your username and password.')
    ).toBeInTheDocument()
  })
})

describe('saved profile integration', () => {
  it('calls list_profiles on mount', async () => {
    mockInvoke.mockResolvedValueOnce([])
    render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('list_profiles')
    })
  })

  it('saved profile selection pre-fills Host/Port/Database/Username; password stays empty and disabled', async () => {
    useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: fixtureA })
    mockInvoke.mockResolvedValueOnce([fixtureA])
    render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
    await waitFor(() => {
      expect((screen.getByLabelText(/host/i) as HTMLInputElement).value).toBe(fixtureA.host)
    })
    expect((screen.getByLabelText(/port/i) as HTMLInputElement).value).toBe(String(fixtureA.port))
    expect((screen.getByLabelText(/database/i) as HTMLInputElement).value).toBe(fixtureA.database)
    expect((screen.getByLabelText(/username/i) as HTMLInputElement).value).toBe(fixtureA.username)
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
    expect(passwordInput.value).toBe('')
    expect(passwordInput).toBeDisabled()
  })

  it('Test Connection button is hidden when a saved profile is active', async () => {
    useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: fixtureA })
    mockInvoke.mockResolvedValueOnce([fixtureA])
    render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /test connection/i })).toBeNull()
    })
  })

  it('Connect button uses connect_with_saved_profile when a saved profile is active', async () => {
    useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: fixtureA })
    mockInvoke
      .mockResolvedValueOnce([fixtureA])              // list_profiles (mount)
      .mockResolvedValueOnce({ schemas: [] })          // connect_with_saved_profile
    render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect & browse schema/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /connect & browse schema/i }))
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('connect_with_saved_profile', { profileId: fixtureA.id })
    })
  })

  it('SaveProfileInline appears after test success when no profile is active', async () => {
    mockInvoke
      .mockResolvedValueOnce([])         // list_profiles (mount)
      .mockResolvedValueOnce(undefined)  // test_connection
    render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      expect(screen.getByText(/save this connection/i)).toBeInTheDocument()
    })
  })

  it('SaveProfileInline does NOT appear when a saved profile is active even after status=connected', async () => {
    useAppStore.setState({
      savedProfiles: [fixtureA],
      activeProfile: fixtureA,
      connectionStatus: 'connected',
    })
    mockInvoke.mockResolvedValueOnce([fixtureA])
    render(<MemoryRouter><ConnectionForm /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect & browse schema/i })).toBeInTheDocument()
    })
    expect(screen.queryByText(/save this connection/i)).toBeNull()
  })
})
