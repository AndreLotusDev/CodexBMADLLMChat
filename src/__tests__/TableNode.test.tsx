import { beforeEach, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TableNode from '../components/schema/TableNode'
import { useAppStore } from '../store/appStore'
import type { PgTable } from '../types'

const mockTable: PgTable = {
  schemaName: 'public',
  name: 'users',
  columns: [
    { name: 'id', dataType: 'integer', isNullable: false, isPrimaryKey: true },
    { name: 'email', dataType: 'text', isNullable: false, isPrimaryKey: false },
  ],
  primaryKeys: ['id'],
  foreignKeys: [],
}

beforeEach(() => {
  useAppStore.setState({
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
  })
})

it('table header shows table name and column count', () => {
  render(<TableNode table={mockTable} />)
  expect(screen.getByText('users')).toBeInTheDocument()
  expect(screen.getByText('(2)')).toBeInTheDocument()
})

it('columns are hidden when not expanded by default', () => {
  render(<TableNode table={mockTable} />)
  expect(screen.queryByText('id')).not.toBeInTheDocument()
  expect(screen.queryByText('email')).not.toBeInTheDocument()
})

it('clicking header toggles expand to show columns', () => {
  render(<TableNode table={mockTable} />)
  fireEvent.click(screen.getByRole('button', { name: /users/i }))
  expect(screen.getByText('id')).toBeInTheDocument()
  expect(screen.getByText('email')).toBeInTheDocument()
})

it('clicking header again collapses columns', () => {
  render(<TableNode table={mockTable} defaultExpanded />)
  expect(screen.getByText('id')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /users/i }))
  expect(screen.queryByText('id')).not.toBeInTheDocument()
})

it('columns are visible when defaultExpanded is true', () => {
  render(<TableNode table={mockTable} defaultExpanded />)
  expect(screen.getByText('id')).toBeInTheDocument()
})

it('renders a checkbox for selecting the table', () => {
  render(<TableNode table={mockTable} />)
  expect(screen.getByRole('checkbox', { name: /select table users/i })).toBeInTheDocument()
})
