import { beforeEach, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ColumnNode from '../components/schema/ColumnNode'
import { useAppStore } from '../store/appStore'
import type { PgColumn } from '../types'

const base: PgColumn = {
  name: 'id',
  dataType: 'integer',
  isNullable: false,
  isPrimaryKey: false,
}

beforeEach(() => {
  useAppStore.setState({
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
  })
})

it('renders column name and data type', () => {
  render(<ColumnNode column={base} schemaName="public" tableName="users" />)
  expect(screen.getByText('id')).toBeInTheDocument()
  expect(screen.getByText('integer')).toBeInTheDocument()
})

it('shows PK indicator when isPrimaryKey is true', () => {
  render(<ColumnNode column={{ ...base, isPrimaryKey: true }} schemaName="public" tableName="users" />)
  expect(screen.getByText('PK')).toBeInTheDocument()
})

it('does not show PK indicator when isPrimaryKey is false', () => {
  render(<ColumnNode column={base} schemaName="public" tableName="users" />)
  expect(screen.queryByText('PK')).not.toBeInTheDocument()
})

it('shows FK reference when foreignKeyRef is present', () => {
  render(
    <ColumnNode
      column={{ ...base, foreignKeyRef: { schema: 'public', table: 'orders', column: 'user_id' } }}
      schemaName="public"
      tableName="users"
    />,
  )
  expect(screen.getByText(/public\.orders\.user_id/)).toBeInTheDocument()
})

it('shows nullable indicator when isNullable is true', () => {
  render(<ColumnNode column={{ ...base, isNullable: true }} schemaName="public" tableName="users" />)
  expect(screen.getByText('?')).toBeInTheDocument()
})

it('does not show nullable indicator when isNullable is false', () => {
  render(<ColumnNode column={base} schemaName="public" tableName="users" />)
  expect(screen.queryByText('?')).not.toBeInTheDocument()
})

it('renders a checkbox bound to the column key', () => {
  render(<ColumnNode column={base} schemaName="public" tableName="users" />)
  expect(screen.getByRole('checkbox', { name: /select column id/i })).toBeInTheDocument()
})
