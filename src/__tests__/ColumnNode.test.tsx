import { render, screen } from '@testing-library/react'
import ColumnNode from '../components/schema/ColumnNode'
import type { PgColumn } from '../types'

const base: PgColumn = {
  name: 'id',
  dataType: 'integer',
  isNullable: false,
  isPrimaryKey: false,
}

it('renders column name and data type', () => {
  render(<ColumnNode column={base} />)
  expect(screen.getByText('id')).toBeInTheDocument()
  expect(screen.getByText('integer')).toBeInTheDocument()
})

it('shows PK indicator when isPrimaryKey is true', () => {
  render(<ColumnNode column={{ ...base, isPrimaryKey: true }} />)
  expect(screen.getByText('PK')).toBeInTheDocument()
})

it('does not show PK indicator when isPrimaryKey is false', () => {
  render(<ColumnNode column={base} />)
  expect(screen.queryByText('PK')).not.toBeInTheDocument()
})

it('shows FK reference when foreignKeyRef is present', () => {
  render(<ColumnNode column={{ ...base, foreignKeyRef: { schema: 'public', table: 'orders', column: 'user_id' } }} />)
  expect(screen.getByText(/public\.orders\.user_id/)).toBeInTheDocument()
})

it('shows nullable indicator when isNullable is true', () => {
  render(<ColumnNode column={{ ...base, isNullable: true }} />)
  expect(screen.getByText('?')).toBeInTheDocument()
})

it('does not show nullable indicator when isNullable is false', () => {
  render(<ColumnNode column={base} />)
  expect(screen.queryByText('?')).not.toBeInTheDocument()
})
