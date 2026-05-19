import { render, screen, fireEvent } from '@testing-library/react'
import TableNode from '../components/schema/TableNode'
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
