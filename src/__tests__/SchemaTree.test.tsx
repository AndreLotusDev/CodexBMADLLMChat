import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SchemaTreeComponent from '../components/schema/SchemaTree'
import { useAppStore } from '../store/appStore'
import type { SchemaTree } from '../types'

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
        {
          schemaName: 'public',
          name: 'orders',
          columns: [
            { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
            { name: 'user_id', dataType: 'integer', isNullable: false, isPrimaryKey: false },
          ],
          primaryKeys: ['id'],
          foreignKeys: [],
        },
      ],
    },
    {
      name: 'auth',
      tables: [],
    },
  ],
}

beforeEach(() => {
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
  })
})

it('renders schema names', () => {
  render(<SchemaTreeComponent tree={mockTree} />)
  expect(screen.getByText('public')).toBeInTheDocument()
  expect(screen.getByText('auth')).toBeInTheDocument()
})

it('renders table names under each schema (schemas expanded by default)', () => {
  render(<SchemaTreeComponent tree={mockTree} />)
  expect(screen.getByText('users')).toBeInTheDocument()
})

it('shows empty state when schemas array is empty', () => {
  render(<SchemaTreeComponent tree={{ schemas: [] }} />)
  expect(screen.getByText(/no schemas found/i)).toBeInTheDocument()
})

describe('schemaFilter behavior', () => {
  it('hides tables that do not match the filter (AC #2)', () => {
    useAppStore.setState({ schemaFilter: 'orders' })
    render(<SchemaTreeComponent tree={mockTree} />)
    expect(screen.queryByText('users')).toBeNull()
    expect(screen.getByText('orders')).toBeInTheDocument()
  })

  it('clearing the filter restores the full tree (AC #3)', () => {
    useAppStore.setState({ schemaFilter: 'orders' })
    const { rerender } = render(<SchemaTreeComponent tree={mockTree} />)
    expect(screen.queryByText('users')).toBeNull()

    useAppStore.setState({ schemaFilter: '' })
    rerender(<SchemaTreeComponent tree={mockTree} />)
    expect(screen.getByText('users')).toBeInTheDocument()
    expect(screen.getByText('orders')).toBeInTheDocument()
  })

  it('matches case-insensitively (AC #4)', () => {
    useAppStore.setState({ schemaFilter: 'USERS' })
    render(<SchemaTreeComponent tree={mockTree} />)
    expect(screen.getByText('users')).toBeInTheDocument()
  })

  it('shows a no-match message when filter matches nothing', () => {
    useAppStore.setState({ schemaFilter: 'zzz_no_match' })
    render(<SchemaTreeComponent tree={mockTree} />)
    expect(screen.getByText(/no tables or columns match/i)).toBeInTheDocument()
  })
})

describe('selection checkboxes (Story 3.1)', () => {
  it('renders a checkbox for every table and every column when expanded', () => {
    // filter 'e' matches both 'users' and 'orders' by table name, so all columns survive
    useAppStore.setState({ schemaFilter: 'e' })
    render(<SchemaTreeComponent tree={mockTree} />)
    // 2 table checkboxes + 4 column checkboxes = 6
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBe(6)
  })

  it('clicking a table checkbox selects all its columns', () => {
    useAppStore.setState({ schemaFilter: 'e' })
    render(<SchemaTreeComponent tree={mockTree} />)
    const usersCheckbox = screen.getByRole('checkbox', { name: /select table users/i })
    fireEvent.click(usersCheckbox)
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(true)
    expect(selectedColumns.has('public.users.id')).toBe(true)
    expect(selectedColumns.has('public.users.email')).toBe(true)
  })

  it('clicking a table again unchecks itself and all its columns', () => {
    useAppStore.setState({ schemaFilter: 'e' })
    render(<SchemaTreeComponent tree={mockTree} />)
    const usersCheckbox = screen.getByRole('checkbox', { name: /select table users/i })
    fireEvent.click(usersCheckbox)
    fireEvent.click(usersCheckbox)
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(false)
    expect(selectedColumns.has('public.users.id')).toBe(false)
    expect(selectedColumns.has('public.users.email')).toBe(false)
  })

  it('clicking a column checkbox with the table already checked leaves the table key but removes that column (indeterminate)', () => {
    useAppStore.setState({ schemaFilter: 'e' })
    render(<SchemaTreeComponent tree={mockTree} />)
    const usersCheckbox = screen.getByRole('checkbox', { name: /select table users/i })
    fireEvent.click(usersCheckbox)
    const emailCheckbox = screen.getByRole('checkbox', { name: /select column email/i })
    fireEvent.click(emailCheckbox)
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(true)
    expect(selectedColumns.has('public.users.email')).toBe(false)
    expect(selectedColumns.has('public.users.id')).toBe(true)
  })

  it('Select all button selects every table and column in that schema', () => {
    render(<SchemaTreeComponent tree={mockTree} />)
    const selectAllButtons = screen.getAllByRole('button', { name: /select all/i })
    // The first one belongs to the "public" schema (auth has no tables but the button still renders disabled).
    fireEvent.click(selectAllButtons[0])
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(true)
    expect(selectedTables.has('public.orders')).toBe(true)
    expect(selectedColumns.has('public.users.id')).toBe(true)
    expect(selectedColumns.has('public.users.email')).toBe(true)
    expect(selectedColumns.has('public.orders.id')).toBe(true)
    expect(selectedColumns.has('public.orders.user_id')).toBe(true)
  })

  it('Deselect all empties selections for that schema only', () => {
    useAppStore.setState({
      selectedTables: new Set(['public.users', 'auth.users']),
      selectedColumns: new Set(['public.users.id', 'auth.users.id']),
    })
    render(<SchemaTreeComponent tree={mockTree} />)
    const deselectButtons = screen.getAllByRole('button', { name: /deselect all/i })
    fireEvent.click(deselectButtons[0])
    const { selectedTables, selectedColumns } = useAppStore.getState()
    expect(selectedTables.has('public.users')).toBe(false)
    expect(selectedColumns.has('public.users.id')).toBe(false)
    expect(selectedTables.has('auth.users')).toBe(true)
    expect(selectedColumns.has('auth.users.id')).toBe(true)
  })
})
