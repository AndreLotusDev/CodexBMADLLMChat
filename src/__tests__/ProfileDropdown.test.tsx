import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import ProfileDropdown from '../components/connection/ProfileDropdown'
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
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

it('returns null and renders nothing when there are no saved profiles', () => {
  render(<ProfileDropdown />)
  expect(screen.queryByLabelText(/saved profile/i)).toBeNull()
})

it('renders the select with manual-entry option plus one option per profile when profiles exist', () => {
  useAppStore.setState({ savedProfiles: [fixtureA, fixtureB] })
  render(<ProfileDropdown />)
  const select = screen.getByLabelText(/saved profile/i) as HTMLSelectElement
  expect(select).toBeInTheDocument()
  expect(select.options).toHaveLength(3)
  expect(select.options[0].text).toMatch(/manual entry/i)
})

it('manual-entry option is selected by default (no active profile)', () => {
  useAppStore.setState({ savedProfiles: [fixtureA] })
  render(<ProfileDropdown />)
  const select = screen.getByLabelText(/saved profile/i) as HTMLSelectElement
  expect(select.value).toBe('')
})

it('selecting a profile sets activeProfile in the store', () => {
  useAppStore.setState({ savedProfiles: [fixtureA, fixtureB] })
  render(<ProfileDropdown />)
  const select = screen.getByLabelText(/saved profile/i)
  fireEvent.change(select, { target: { value: fixtureA.id } })
  expect(useAppStore.getState().activeProfile?.id).toBe(fixtureA.id)
})

it('selecting manual-entry clears activeProfile', () => {
  useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: fixtureA })
  render(<ProfileDropdown />)
  const select = screen.getByLabelText(/saved profile/i)
  fireEvent.change(select, { target: { value: '' } })
  expect(useAppStore.getState().activeProfile).toBeNull()
})

it('Delete button is disabled when no profile is active', () => {
  useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: null })
  render(<ProfileDropdown />)
  expect(screen.getByRole('button', { name: /delete selected profile/i })).toBeDisabled()
})

it('Delete calls deleteProfile and removes the profile from the store', async () => {
  useAppStore.setState({ savedProfiles: [fixtureA, fixtureB], activeProfile: fixtureA })
  mockInvoke.mockResolvedValueOnce(undefined)
  render(<ProfileDropdown />)
  fireEvent.click(screen.getByRole('button', { name: /delete selected profile/i }))
  await waitFor(() => {
    expect(mockInvoke).toHaveBeenCalledWith('delete_profile', { profileId: fixtureA.id })
  })
  await waitFor(() => {
    const ids = useAppStore.getState().savedProfiles.map(p => p.id)
    expect(ids).not.toContain(fixtureA.id)
  })
})

it('Delete is canceled when window.confirm returns false (invoke NOT called)', () => {
  ;(window.confirm as ReturnType<typeof vi.fn>).mockReturnValueOnce(false)
  useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: fixtureA })
  render(<ProfileDropdown />)
  fireEvent.click(screen.getByRole('button', { name: /delete selected profile/i }))
  expect(mockInvoke).not.toHaveBeenCalled()
})

it('Delete error path: alerts the user with the error message', async () => {
  useAppStore.setState({ savedProfiles: [fixtureA], activeProfile: fixtureA })
  mockInvoke.mockRejectedValueOnce({ code: 'Internal', message: 'oops' })
  render(<ProfileDropdown />)
  fireEvent.click(screen.getByRole('button', { name: /delete selected profile/i }))
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('oops'))
  })
})
