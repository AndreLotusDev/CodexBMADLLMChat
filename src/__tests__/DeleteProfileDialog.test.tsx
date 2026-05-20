import { render, screen, fireEvent } from '@testing-library/react'
import DeleteProfileDialog from '../components/settings/DeleteProfileDialog'
import type { ConnectionProfile } from '../types'

const fixture: ConnectionProfile = {
  id: 'profile-a-id',
  name: 'Alpha',
  host: 'a.example.com',
  port: 5432,
  database: 'a_db',
  username: 'postgres',
  createdAt: '2026-05-20T00:00:00Z',
}

it('returns null when profile is null', () => {
  render(
    <DeleteProfileDialog profile={null} isDeleting={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
  )
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('renders the profile name in the message when open', () => {
  render(
    <DeleteProfileDialog profile={fixture} isDeleting={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
  )
  const dialog = screen.getByRole('dialog')
  expect(dialog).toBeInTheDocument()
  expect(dialog).toHaveTextContent('Alpha')
})

it('Cancel button calls onCancel', () => {
  const onCancel = vi.fn()
  render(
    <DeleteProfileDialog profile={fixture} isDeleting={false} onConfirm={vi.fn()} onCancel={onCancel} />
  )
  fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
  expect(onCancel).toHaveBeenCalledTimes(1)
})

it('Confirm button calls onConfirm', () => {
  const onConfirm = vi.fn()
  render(
    <DeleteProfileDialog profile={fixture} isDeleting={false} onConfirm={onConfirm} onCancel={vi.fn()} />
  )
  fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
  expect(onConfirm).toHaveBeenCalledTimes(1)
})

it('Escape key calls onCancel', () => {
  const onCancel = vi.fn()
  render(
    <DeleteProfileDialog profile={fixture} isDeleting={false} onConfirm={vi.fn()} onCancel={onCancel} />
  )
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onCancel).toHaveBeenCalledTimes(1)
})

it('Backdrop click calls onCancel', () => {
  const onCancel = vi.fn()
  render(
    <DeleteProfileDialog profile={fixture} isDeleting={false} onConfirm={vi.fn()} onCancel={onCancel} />
  )
  fireEvent.click(screen.getByRole('dialog'))
  expect(onCancel).toHaveBeenCalledTimes(1)
})

it('Confirm and Cancel are disabled while isDeleting is true; Confirm label reads "Deleting…"', () => {
  render(
    <DeleteProfileDialog profile={fixture} isDeleting={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
  )
  expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled()
  const confirmBtn = screen.getByRole('button', { name: /deleting…/i })
  expect(confirmBtn).toBeDisabled()
})

it('Escape and backdrop click are ignored while isDeleting is true', () => {
  const onCancel = vi.fn()
  render(
    <DeleteProfileDialog profile={fixture} isDeleting={true} onConfirm={vi.fn()} onCancel={onCancel} />
  )
  fireEvent.keyDown(window, { key: 'Escape' })
  fireEvent.click(screen.getByRole('dialog'))
  expect(onCancel).not.toHaveBeenCalled()
})
