import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
