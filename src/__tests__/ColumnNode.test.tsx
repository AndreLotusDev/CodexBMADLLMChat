import { beforeEach, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ColumnNode from '../components/schema/ColumnNode'
import { useAppStore } from '../store/appStore'
import { buildAnnotationKey } from '../lib/utils'
import type { Annotation, PgColumn } from '../types'

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
    annotations: new Map<string, Annotation>(),
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

const emailColumn: PgColumn = {
  name: 'email',
  dataType: 'text',
  isNullable: false,
  isPrimaryKey: false,
}

it('shows an Add annotation icon button when no column annotation exists', () => {
  render(<ColumnNode column={emailColumn} schemaName="public" tableName="users" />)
  expect(
    screen.getByRole('button', { name: /add annotation to email/i }),
  ).toBeInTheDocument()
})

it('clicking the annotation icon opens the inline AnnotationInput for the column', () => {
  render(<ColumnNode column={emailColumn} schemaName="public" tableName="users" />)
  fireEvent.click(screen.getByRole('button', { name: /add annotation to email/i }))
  expect(screen.getByLabelText(/Annotation for email/i)).toBeInTheDocument()
})

it('with a column annotation seeded, the icon labels itself "Edit annotation for email"', () => {
  const key = buildAnnotationKey('public', 'users', 'email')
  useAppStore.setState({
    annotations: new Map<string, Annotation>([
      [
        key,
        {
          id: 'x',
          connectionProfileId: '',
          schemaName: 'public',
          tableName: 'users',
          columnName: 'email',
          text: 'unique user email',
          updatedAt: '2026-05-19T00:00:00Z',
        },
      ],
    ]),
  })
  render(<ColumnNode column={emailColumn} schemaName="public" tableName="users" />)
  expect(
    screen.getByRole('button', { name: /edit annotation for email/i }),
  ).toBeInTheDocument()
})

it('removing the column annotation flips the marker back to "Add annotation"', () => {
  const key = buildAnnotationKey('public', 'users', 'email')
  useAppStore.setState({
    annotations: new Map<string, Annotation>([
      [
        key,
        {
          id: 'x',
          connectionProfileId: '',
          schemaName: 'public',
          tableName: 'users',
          columnName: 'email',
          text: 'tmp',
          updatedAt: '2026-05-19T00:00:00Z',
        },
      ],
    ]),
  })
  const { rerender } = render(
    <ColumnNode column={emailColumn} schemaName="public" tableName="users" />,
  )
  expect(
    screen.getByRole('button', { name: /edit annotation for email/i }),
  ).toBeInTheDocument()
  useAppStore.getState().removeAnnotation(key)
  rerender(<ColumnNode column={emailColumn} schemaName="public" tableName="users" />)
  expect(
    screen.getByRole('button', { name: /add annotation to email/i }),
  ).toBeInTheDocument()
})
