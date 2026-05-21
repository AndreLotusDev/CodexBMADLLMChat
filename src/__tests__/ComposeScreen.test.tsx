import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ComposeScreen from '../screens/ComposeScreen'
import { useAppStore } from '../store/appStore'
import type { Annotation, SchemaTree } from '../types'

// Mock RichTextEditor to a simple textarea — TipTap is tested separately in RichTextEditor.test.tsx
vi.mock('../components/prompt/RichTextEditor', () => ({
  default: ({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel: string }) => (
    <textarea aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockTree: SchemaTree = {
  schemas: [
    {
      name: 'public',
      tables: [
        {
          schemaName: 'public',
          name: 'users',
          columns: [
            { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
          ],
          primaryKeys: ['id'],
          foreignKeys: [],
        },
      ],
    },
  ],
}

beforeEach(() => {
  mockNavigate.mockClear()
  useAppStore.setState({
    connectionStatus: 'connected',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
    annotations: new Map<string, Annotation>(),
    prompt: null,
    query: '',
    expectedOutput: '',
    isGenerating: false,
    savedProfiles: [],
    activeProfile: null,
  })
})

const renderScreen = () =>
  render(
    <MemoryRouter>
      <ComposeScreen />
    </MemoryRouter>,
  )

describe('ComposeScreen', () => {
  it('shows empty-state when no tables are selected', () => {
    renderScreen()
    expect(screen.getByText('No tables selected yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to Schema Browser/i })).toBeInTheDocument()
  })

  it('renders both editors when tables are selected', () => {
    useAppStore.setState({
      schemaTree: mockTree,
      selectedTables: new Set(['public.users']),
      selectedColumns: new Set(['public.users.id']),
    })
    renderScreen()
    expect(screen.getByLabelText('Natural language query')).toBeInTheDocument()
    expect(screen.getByLabelText('Expected output')).toBeInTheDocument()
  })

  it('Generate Prompt button calls generatePrompt and navigates to /prompt', () => {
    useAppStore.setState({
      schemaTree: mockTree,
      selectedTables: new Set(['public.users']),
      selectedColumns: new Set(['public.users.id']),
      query: 'Show me all users.',
    })
    renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /Generate Prompt/i }))
    expect(useAppStore.getState().prompt).not.toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/prompt')
  })

  it('Back button navigates to /schema and does NOT clear query or expectedOutput', () => {
    useAppStore.setState({
      schemaTree: mockTree,
      selectedTables: new Set(['public.users']),
      selectedColumns: new Set(['public.users.id']),
      query: 'My query',
      expectedOutput: 'My output',
    })
    renderScreen()
    fireEvent.click(screen.getByRole('button', { name: /^Back$/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/schema')
    expect(useAppStore.getState().query).toBe('My query')
    expect(useAppStore.getState().expectedOutput).toBe('My output')
  })
})
