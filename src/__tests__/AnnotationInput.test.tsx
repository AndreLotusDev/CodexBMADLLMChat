import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import AnnotationInput from '../components/schema/AnnotationInput'
import { useAppStore } from '../store/appStore'
import { buildAnnotationKey } from '../lib/utils'
import type { Annotation, ConnectionProfile } from '../types'

const mockInvoke = invoke as ReturnType<typeof vi.fn>

const profileFixture: ConnectionProfile = {
  id: 'profile-1',
  name: 'Prod',
  host: 'prod.example.com',
  port: 5432,
  database: 'app',
  username: 'postgres',
  createdAt: '2026-05-20T00:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
  mockInvoke.mockImplementation(async () => undefined)
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
    annotations: new Map<string, Annotation>(),
    savedProfiles: [],
    activeProfile: null,
  })
})

it('renders a textarea with maxLength=500 and autoFocus', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i) as HTMLTextAreaElement
  expect(textarea).toBeInTheDocument()
  expect(textarea.maxLength).toBe(500)
  expect(textarea).toHaveFocus()
})

it('typing into the textarea writes to the store under the table-level key', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  const key = buildAnnotationKey('public', 'users', null)
  expect(useAppStore.getState().annotations.get(key)?.text).toBe('hello')
})

it('clearing the textarea to empty removes the annotation from the store', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  fireEvent.change(textarea, { target: { value: '' } })
  const key = buildAnnotationKey('public', 'users', null)
  expect(useAppStore.getState().annotations.has(key)).toBe(false)
})

it('whitespace-only text also removes the annotation', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  fireEvent.change(textarea, { target: { value: '   ' } })
  const key = buildAnnotationKey('public', 'users', null)
  expect(useAppStore.getState().annotations.has(key)).toBe(false)
})

it('character counter renders {N}/500 based on current text length', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  expect(screen.getByText('0/500')).toBeInTheDocument()
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  expect(screen.getByText('5/500')).toBeInTheDocument()
})

it('clicking the Done button calls onClose', () => {
  const onClose = vi.fn()
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={onClose}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /done/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('pre-existing annotation seeds the textarea with the stored text', () => {
  const key = buildAnnotationKey('public', 'users', null)
  useAppStore.setState({
    annotations: new Map<string, Annotation>([
      [
        key,
        {
          id: 'x',
          connectionProfileId: '',
          schemaName: 'public',
          tableName: 'users',
          columnName: null,
          text: 'preset',
          updatedAt: '2026-05-19T00:00:00Z',
        },
      ],
    ]),
  })
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  expect((screen.getByLabelText(/Annotation for/i) as HTMLTextAreaElement).value).toBe('preset')
})

it('column-level annotation uses the column-level key', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName="email"
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'pk surrogate' } })
  expect(useAppStore.getState().annotations.get('public.users.email')?.text).toBe('pk surrogate')
})

describe('IPC-wired persistence (active profile)', () => {
  beforeEach(() => {
    useAppStore.setState({ activeProfile: profileFixture })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('typing triggers debounced upsert_annotation 500ms after the last keystroke', async () => {
    mockInvoke.mockImplementation(async (cmd: string, args: Record<string, unknown>) => {
      if (cmd === 'upsert_annotation') {
        return {
          id: 'server-issued-id',
          connectionProfileId: args.profileId,
          schemaName: args.schemaName,
          tableName: args.tableName,
          columnName: args.columnName,
          text: args.text,
          updatedAt: '2026-05-20T12:00:00Z',
        }
      }
      return undefined
    })

    render(
      <AnnotationInput
        schemaName="public"
        tableName="users"
        columnName={null}
        onClose={() => {}}
      />,
    )
    const textarea = screen.getByLabelText(/Annotation for/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })

    expect(mockInvoke).not.toHaveBeenCalledWith('upsert_annotation', expect.anything())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(mockInvoke).toHaveBeenCalledWith('upsert_annotation', {
      profileId: profileFixture.id,
      schemaName: 'public',
      tableName: 'users',
      columnName: null,
      text: 'hello',
    })

    const key = buildAnnotationKey('public', 'users', null)
    const stored = useAppStore.getState().annotations.get(key)
    expect(stored?.id).toBe('server-issued-id')
    expect(stored?.text).toBe('hello')
  })

  it('clearing the input triggers delete_annotation when an existing annotation is loaded', async () => {
    const key = buildAnnotationKey('public', 'users', null)
    useAppStore.setState({
      annotations: new Map<string, Annotation>([
        [
          key,
          {
            id: 'existing-id-from-db',
            connectionProfileId: profileFixture.id,
            schemaName: 'public',
            tableName: 'users',
            columnName: null,
            text: 'old text',
            updatedAt: '2026-05-19T00:00:00Z',
          },
        ],
      ]),
    })
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'delete_annotation') return undefined
      return undefined
    })

    render(
      <AnnotationInput
        schemaName="public"
        tableName="users"
        columnName={null}
        onClose={() => {}}
      />,
    )
    const textarea = screen.getByLabelText(/Annotation for/i)
    fireEvent.change(textarea, { target: { value: '' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    // Flush the pending delete_annotation promise.
    await act(async () => { await Promise.resolve() })

    expect(mockInvoke).toHaveBeenCalledWith('delete_annotation', { annotationId: 'existing-id-from-db' })
    expect(useAppStore.getState().annotations.has(key)).toBe(false)
  })

  it('does NOT call IPC when activeProfile is null (manual-entry session)', async () => {
    useAppStore.setState({ activeProfile: null })

    render(
      <AnnotationInput
        schemaName="public"
        tableName="users"
        columnName={null}
        onClose={() => {}}
      />,
    )
    const textarea = screen.getByLabelText(/Annotation for/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(mockInvoke).not.toHaveBeenCalledWith('upsert_annotation', expect.anything())
    expect(mockInvoke).not.toHaveBeenCalledWith('delete_annotation', expect.anything())

    const key = buildAnnotationKey('public', 'users', null)
    expect(useAppStore.getState().annotations.get(key)?.text).toBe('hello')
  })

  it('unmounting flushes a pending debounced save', async () => {
    mockInvoke.mockImplementation(async (cmd: string, args: Record<string, unknown>) => {
      if (cmd === 'upsert_annotation') {
        return {
          id: 'server-id',
          connectionProfileId: args.profileId,
          schemaName: args.schemaName,
          tableName: args.tableName,
          columnName: args.columnName,
          text: args.text,
          updatedAt: '2026-05-20T12:00:00Z',
        }
      }
      return undefined
    })

    const { unmount } = render(
      <AnnotationInput
        schemaName="public"
        tableName="users"
        columnName={null}
        onClose={() => {}}
      />,
    )
    const textarea = screen.getByLabelText(/Annotation for/i)
    fireEvent.change(textarea, { target: { value: 'pending' } })

    unmount()

    expect(mockInvoke).toHaveBeenCalledWith('upsert_annotation', expect.objectContaining({ text: 'pending' }))
  })

  it('IPC error keeps the in-memory annotation', async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'upsert_annotation') {
        throw { code: 'Internal', message: 'boom' }
      }
      return undefined
    })

    render(
      <AnnotationInput
        schemaName="public"
        tableName="users"
        columnName={null}
        onClose={() => {}}
      />,
    )
    const textarea = screen.getByLabelText(/Annotation for/i)
    fireEvent.change(textarea, { target: { value: 'optimistic' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    await act(async () => { await Promise.resolve() })

    const key = buildAnnotationKey('public', 'users', null)
    const stored = useAppStore.getState().annotations.get(key)
    expect(stored).toBeDefined()
    expect(stored?.text).toBe('optimistic')
  })
})
