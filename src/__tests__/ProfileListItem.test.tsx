import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import ProfileListItem from '../components/settings/ProfileListItem'
import { useAppStore } from '../store/appStore'
import type { ConnectionProfile } from '../types'

const mockInvoke = invoke as ReturnType<typeof vi.fn>

const fixture: ConnectionProfile = {
  id: 'profile-a-id',
  name: 'Alpha',
  host: 'a.example.com',
  port: 5432,
  database: 'a_db',
  username: 'postgres',
  createdAt: '2026-05-20T00:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
  useAppStore.setState({ savedProfiles: [fixture], activeProfile: null })
})

it('renders the profile name and host:port/database meta line', () => {
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  expect(screen.getByRole('button', { name: /rename profile alpha/i })).toBeInTheDocument()
  expect(screen.getByText('a.example.com:5432/a_db')).toBeInTheDocument()
})

it('entering edit mode shows the Input pre-filled with the current name', () => {
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /rename profile alpha/i }))
  const input = screen.getByLabelText('Profile name') as HTMLInputElement
  expect(input).toBeInTheDocument()
  expect(input.value).toBe('Alpha')
})

it('Enter commits: invokes rename_profile and updates the store name', async () => {
  mockInvoke.mockResolvedValueOnce(undefined)
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /rename profile alpha/i }))
  const input = screen.getByLabelText('Profile name')
  fireEvent.change(input, { target: { value: 'NewName' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  await waitFor(() => {
    expect(mockInvoke).toHaveBeenCalledWith('rename_profile', {
      profileId: fixture.id,
      newName: 'NewName',
    })
  })
  await waitFor(() => {
    expect(useAppStore.getState().savedProfiles[0].name).toBe('NewName')
  })
})

it('Blur commits the same as Enter', async () => {
  mockInvoke.mockResolvedValueOnce(undefined)
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /rename profile alpha/i }))
  const input = screen.getByLabelText('Profile name')
  fireEvent.change(input, { target: { value: 'ViaBlur' } })
  fireEvent.blur(input)
  await waitFor(() => {
    expect(mockInvoke).toHaveBeenCalledWith('rename_profile', {
      profileId: fixture.id,
      newName: 'ViaBlur',
    })
  })
  await waitFor(() => {
    expect(useAppStore.getState().savedProfiles[0].name).toBe('ViaBlur')
  })
})

it('Escape cancels: name is restored and no IPC call is made', () => {
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /rename profile alpha/i }))
  const input = screen.getByLabelText('Profile name')
  fireEvent.change(input, { target: { value: 'DiscardMe' } })
  fireEvent.keyDown(input, { key: 'Escape' })
  expect(mockInvoke).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /rename profile alpha/i })).toBeInTheDocument()
})

it('empty/whitespace draft commits as cancel: original name restored, no IPC call', () => {
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /rename profile alpha/i }))
  const input = screen.getByLabelText('Profile name')
  fireEvent.change(input, { target: { value: '   ' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(mockInvoke).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /rename profile alpha/i })).toBeInTheDocument()
})

it('unchanged trimmed draft skips the IPC call', () => {
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /rename profile alpha/i }))
  const input = screen.getByLabelText('Profile name')
  // draft is "Alpha" already; commit without changing
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(mockInvoke).not.toHaveBeenCalled()
})

it('IPC error shows the message inline and edit mode stays open', async () => {
  mockInvoke.mockRejectedValueOnce({ code: 'Internal', message: 'boom' })
  render(<ProfileListItem profile={fixture} onRequestDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: /rename profile alpha/i }))
  const input = screen.getByLabelText('Profile name')
  fireEvent.change(input, { target: { value: 'WillFail' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  await waitFor(() => {
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
  // input still present → edit mode preserved
  expect(screen.getByLabelText('Profile name')).toBeInTheDocument()
})

it('Delete button calls onRequestDelete with the profile', () => {
  const onRequestDelete = vi.fn()
  render(<ProfileListItem profile={fixture} onRequestDelete={onRequestDelete} />)
  fireEvent.click(screen.getByRole('button', { name: /delete profile alpha/i }))
  expect(onRequestDelete).toHaveBeenCalledTimes(1)
  expect(onRequestDelete).toHaveBeenCalledWith(fixture)
})
