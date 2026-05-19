import { render, screen } from '@testing-library/react'
import SchemaTreeComponent from '../components/schema/SchemaTree'
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
      ],
    },
    {
      name: 'auth',
      tables: [],
    },
  ],
}

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
