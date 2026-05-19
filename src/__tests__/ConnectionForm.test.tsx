import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import ConnectionForm from '../components/connection/ConnectionForm'
import { useAppStore } from '../store/appStore'

const mockInvoke = invoke as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockInvoke.mockReset()
  useAppStore.setState({ connectionStatus: 'idle', connectionError: null })
})

const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/host/i), { target: { value: 'localhost' } })
  fireEvent.change(screen.getByLabelText(/port/i), { target: { value: '5432' } })
  fireEvent.change(screen.getByLabelText(/database/i), { target: { value: 'mydb' } })
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'postgres' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
}

it('renders all 5 form fields', () => {
  render(<ConnectionForm />)
  expect(screen.getByLabelText(/host/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/port/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/database/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  expect(screen.getByLabelText('Password')).toBeInTheDocument()
})

it('Test Connection button is disabled when fields are empty', () => {
  render(<ConnectionForm />)
  expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled()
})

it('Test Connection button is enabled when all fields are filled', () => {
  render(<ConnectionForm />)
  fillForm()
  expect(screen.getByRole('button', { name: /test connection/i })).not.toBeDisabled()
})

it('password field is masked by default, toggles to text on show button click', () => {
  render(<ConnectionForm />)
  const passwordInput = screen.getByLabelText('Password')
  expect(passwordInput).toHaveAttribute('type', 'password')
  fireEvent.click(screen.getByRole('button', { name: /show password/i }))
  expect(passwordInput).toHaveAttribute('type', 'text')
})

it('password toggle is bidirectional: text reverts to password on second click', () => {
  render(<ConnectionForm />)
  const passwordInput = screen.getByLabelText('Password')
  fireEvent.click(screen.getByRole('button', { name: /show password/i }))
  expect(passwordInput).toHaveAttribute('type', 'text')
  fireEvent.click(screen.getByRole('button', { name: /hide password/i }))
  expect(passwordInput).toHaveAttribute('type', 'password')
})

it('button shows "Testing…" text while connecting', async () => {
  let resolve: (v: undefined) => void
  mockInvoke.mockReturnValueOnce(new Promise(r => { resolve = r }))
  render(<ConnectionForm />)
  fillForm()
  fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /testing/i })).toBeInTheDocument()
  })
  resolve!(undefined)
})

it('shows success banner when invoke resolves', async () => {
  mockInvoke.mockResolvedValueOnce(undefined)
  render(<ConnectionForm />)
  fillForm()
  fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
  await waitFor(() => {
    expect(screen.getByText(/connection successful/i)).toBeInTheDocument()
  })
})

it('shows error banner when invoke rejects with TauriCommandError', async () => {
  mockInvoke.mockRejectedValueOnce({
    code: 'AuthFailed',
    message: 'Authentication failed. Check your username and password.',
  })
  render(<ConnectionForm />)
  fillForm()
  fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
  await waitFor(() => {
    expect(
      screen.getByText('Authentication failed. Check your username and password.')
    ).toBeInTheDocument()
  })
})
