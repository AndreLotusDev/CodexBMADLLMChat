import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import ProfileList from '../components/settings/ProfileList'
import { useAppStore } from '../store/appStore'
import type { ConnectionProfile } from '../types'

const mockInvoke = invoke as ReturnType<typeof vi.fn>

const fixtureA: ConnectionProfile = {
  id: 'profile-a-id',
  name: 'Alpha',
  host: 'a.example.com',
  port: 5432,
  database: 'a_db',
  username: 'postgres',
  createdAt: '2026-05-20T00:00:00Z',
}
const fixtureB: ConnectionProfile = {
  id: 'profile-b-id',
  name: 'Beta',
  host: 'b.example.com',
  port: 5432,
  database: 'b_db',
  username: 'postgres',
  createdAt: '2026-05-20T01:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
  useAppStore.setState({ savedProfiles: [], activeProfile: null })
})

it('loads profiles on mount via list_profiles and renders one row per profile', async () => {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_profiles') return Promise.resolve([fixtureA, fixtureB])
    return Promise.reject(new Error(`unexpected ${cmd}`))
  })
  render(<ProfileList />)
  await waitFor(() => {
    expect(useAppStore.getState().savedProfiles).toHaveLength(2)
  })
  expect(screen.getByRole('button', { name: /rename profile alpha/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /rename profile beta/i })).toBeInTheDocument()
})

it('empty-state message renders when savedProfiles is empty after load', async () => {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_profiles') return Promise.resolve([])
    return Promise.reject(new Error(`unexpected ${cmd}`))
  })
  render(<ProfileList />)
  await waitFor(() => {
    expect(screen.getByText(/no saved profiles yet/i)).toBeInTheDocument()
  })
})

it('clicking Delete on a row opens the confirmation dialog with that profile', async () => {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_profiles') return Promise.resolve([fixtureA, fixtureB])
    return Promise.reject(new Error(`unexpected ${cmd}`))
  })
  render(<ProfileList />)
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /delete profile alpha/i })).toBeInTheDocument()
  })
  fireEvent.click(screen.getByRole('button', { name: /delete profile alpha/i }))
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveTextContent('Alpha')
})

it('confirming delete invokes delete_profile, removes the profile from the store, and closes the dialog', async () => {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_profiles') return Promise.resolve([fixtureA, fixtureB])
    if (cmd === 'delete_profile') return Promise.resolve(undefined)
    return Promise.reject(new Error(`unexpected ${cmd}`))
  })
  render(<ProfileList />)
  await waitFor(() => {
    expect(useAppStore.getState().savedProfiles).toHaveLength(2)
  })
  fireEvent.click(screen.getByRole('button', { name: /delete profile alpha/i }))
  await screen.findByRole('dialog')
  fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
  await waitFor(() => {
    expect(mockInvoke).toHaveBeenCalledWith('delete_profile', { profileId: fixtureA.id })
  })
  await waitFor(() => {
    const ids = useAppStore.getState().savedProfiles.map(p => p.id)
    expect(ids).not.toContain(fixtureA.id)
    expect(ids).toContain(fixtureB.id)
  })
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

it('cancel from the dialog leaves the store unchanged and closes the dialog', async () => {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_profiles') return Promise.resolve([fixtureA, fixtureB])
    return Promise.reject(new Error(`unexpected ${cmd}`))
  })
  render(<ProfileList />)
  await waitFor(() => {
    expect(useAppStore.getState().savedProfiles).toHaveLength(2)
  })
  fireEvent.click(screen.getByRole('button', { name: /delete profile alpha/i }))
  await screen.findByRole('dialog')
  fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  expect(useAppStore.getState().savedProfiles).toHaveLength(2)
})

it('delete_profile failure surfaces the error and keeps the profile in the list', async () => {
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_profiles') return Promise.resolve([fixtureA, fixtureB])
    if (cmd === 'delete_profile') return Promise.reject({ code: 'Internal', message: 'kaboom' })
    return Promise.reject(new Error(`unexpected ${cmd}`))
  })
  render(<ProfileList />)
  await waitFor(() => {
    expect(useAppStore.getState().savedProfiles).toHaveLength(2)
  })
  fireEvent.click(screen.getByRole('button', { name: /delete profile alpha/i }))
  await screen.findByRole('dialog')
  fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
  await waitFor(() => {
    expect(screen.getByText(/delete failed: kaboom/i)).toBeInTheDocument()
  })
  expect(useAppStore.getState().savedProfiles.map(p => p.id)).toContain(fixtureA.id)
})

it('deleting the active profile clears activeProfile via the store action', async () => {
  useAppStore.setState({ activeProfile: fixtureA })
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === 'list_profiles') return Promise.resolve([fixtureA, fixtureB])
    if (cmd === 'delete_profile') return Promise.resolve(undefined)
    return Promise.reject(new Error(`unexpected ${cmd}`))
  })
  render(<ProfileList />)
  await waitFor(() => {
    expect(useAppStore.getState().savedProfiles).toHaveLength(2)
  })
  fireEvent.click(screen.getByRole('button', { name: /delete profile alpha/i }))
  await screen.findByRole('dialog')
  fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
  await waitFor(() => {
    expect(useAppStore.getState().activeProfile).toBeNull()
  })
})
