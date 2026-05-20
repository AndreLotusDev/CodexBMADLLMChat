import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SchemaBrowserScreen from '../screens/SchemaBrowserScreen'
import { useAppStore } from '../store/appStore'
import type { Annotation, SchemaTree } from '../types'

vi.mock('@/commands', () => ({
  commands: {
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

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
            { name: 'email', dataType: 'text', isNullable: false, isPrimaryKey: false },
          ],
          primaryKeys: ['id'],
          foreignKeys: [],
        },
      ],
    },
  ],
}

beforeEach(() => {
  useAppStore.setState({
    connectionStatus: 'connected',
    connectionError: null,
    schemaTree: mockTree,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
    annotations: new Map<string, Annotation>(),
    prompt: null,
    isGenerating: false,
  })
})

const renderScreen = () =>
  render(
    <MemoryRouter>
      <SchemaBrowserScreen />
    </MemoryRouter>,
  )

describe('SchemaBrowserScreen — Generate Prompt button', () => {
  it('renders the "Generate Prompt" button and disables it when no selection', () => {
    renderScreen()
    const button = screen.getByRole('button', { name: /Generate Prompt/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('enables the button when at least one table is selected', () => {
    useAppStore.setState({
      selectedTables: new Set(['public.users']),
      selectedColumns: new Set(['public.users.id', 'public.users.email']),
    })
    renderScreen()
    const button = screen.getByRole('button', { name: /Generate Prompt/i })
    expect(button).not.toBeDisabled()
  })

  it('clicking the button populates the prompt in the store', () => {
    useAppStore.setState({
      selectedTables: new Set(['public.users']),
      selectedColumns: new Set(['public.users.id', 'public.users.email']),
    })
    renderScreen()
    const button = screen.getByRole('button', { name: /Generate Prompt/i })
    fireEvent.click(button)
    const stored = useAppStore.getState().prompt
    expect(stored).not.toBeNull()
    expect(stored?.content).toContain('CREATE TABLE public.users')
    expect(stored?.tableCount).toBe(1)
    expect(stored?.columnCount).toBe(2)
  })
})
