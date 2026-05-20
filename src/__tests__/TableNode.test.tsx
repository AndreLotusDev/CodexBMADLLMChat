import { beforeEach, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TableNode from '../components/schema/TableNode'
import { useAppStore } from '../store/appStore'
import { buildAnnotationKey } from '../lib/utils'
import type { Annotation, PgTable } from '../types'

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
    annotations: new Map<string, Annotation>(),
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
  fireEvent.click(screen.getByRole('button', { name: /^users\(2\)$/ }))
  expect(screen.getByText('id')).toBeInTheDocument()
  expect(screen.getByText('email')).toBeInTheDocument()
})

it('clicking header again collapses columns', () => {
  render(<TableNode table={mockTable} defaultExpanded />)
  expect(screen.getByText('id')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^users\(2\)$/ }))
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

it('shows an Add annotation icon button when no annotation exists for the table', () => {
  render(<TableNode table={mockTable} />)
  expect(
    screen.getByRole('button', { name: /add annotation to users/i }),
  ).toBeInTheDocument()
})

it('clicking the annotation icon opens the inline AnnotationInput', () => {
  render(<TableNode table={mockTable} />)
  fireEvent.click(screen.getByRole('button', { name: /add annotation to users/i }))
  expect(screen.getByLabelText(/Annotation for public\.users/i)).toBeInTheDocument()
})

it('with an annotation seeded in the store, the icon labels itself "Edit annotation"', () => {
  const key = buildAnnotationKey('public', 'users', null)
  useAppStore.setState({
    annotations: new Map<string, Annotation>([
      [
        key,
        {
          id: 'x',
          connectionProfileId: '',
          schemaName: 'public',
          tableName: 'users',
          columnName: null,
          text: 'already annotated',
          updatedAt: '2026-05-19T00:00:00Z',
        },
      ],
    ]),
  })
  render(<TableNode table={mockTable} />)
  expect(
    screen.getByRole('button', { name: /edit annotation for users/i }),
  ).toBeInTheDocument()
})

it('removing the annotation flips the marker back to "Add annotation"', () => {
  const key = buildAnnotationKey('public', 'users', null)
  useAppStore.setState({
    annotations: new Map<string, Annotation>([
      [
        key,
        {
          id: 'x',
          connectionProfileId: '',
          schemaName: 'public',
          tableName: 'users',
          columnName: null,
          text: 'tmp',
          updatedAt: '2026-05-19T00:00:00Z',
        },
      ],
    ]),
  })
  const { rerender } = render(<TableNode table={mockTable} />)
  expect(
    screen.getByRole('button', { name: /edit annotation for users/i }),
  ).toBeInTheDocument()
  useAppStore.getState().removeAnnotation(key)
  rerender(<TableNode table={mockTable} />)
  expect(
    screen.getByRole('button', { name: /add annotation to users/i }),
  ).toBeInTheDocument()
})
