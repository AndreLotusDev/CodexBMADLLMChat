import { beforeEach, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SelectionSummary from '../components/schema/SelectionSummary'
import { useAppStore } from '../store/appStore'

beforeEach(() => {
  useAppStore.setState({
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
  })
})

it('renders "0 tables, 0 columns selected" when state is empty', () => {
  render(<SelectionSummary />)
  expect(screen.getByText('0 tables, 0 columns selected')).toBeInTheDocument()
})

it('renders singular "table" and plural "columns" for 1 table, 2 columns', () => {
  useAppStore.setState({
    selectedTables: new Set(['public.users']),
    selectedColumns: new Set(['public.users.id', 'public.users.email']),
  })
  render(<SelectionSummary />)
  expect(screen.getByText('1 table, 2 columns selected')).toBeInTheDocument()
})

it('renders plural for the AC #5 example "3 tables, 12 columns selected"', () => {
  useAppStore.setState({
    selectedTables: new Set(['s.a', 's.b', 's.c']),
    selectedColumns: new Set([
      's.a.1', 's.a.2', 's.a.3', 's.a.4',
      's.b.1', 's.b.2', 's.b.3', 's.b.4',
      's.c.1', 's.c.2', 's.c.3', 's.c.4',
    ]),
  })
  render(<SelectionSummary />)
  expect(screen.getByText('3 tables, 12 columns selected')).toBeInTheDocument()
})

it('renders singular "column" when only one column is selected', () => {
  useAppStore.setState({
    selectedTables: new Set(['public.users']),
    selectedColumns: new Set(['public.users.id']),
  })
  render(<SelectionSummary />)
  expect(screen.getByText('1 table, 1 column selected')).toBeInTheDocument()
})

it('updates when store changes after initial render', () => {
  const { rerender } = render(<SelectionSummary />)
  expect(screen.getByText('0 tables, 0 columns selected')).toBeInTheDocument()

  useAppStore.setState({
    selectedTables: new Set(['public.users']),
    selectedColumns: new Set(['public.users.id', 'public.users.email']),
  })
  rerender(<SelectionSummary />)
  expect(screen.getByText('1 table, 2 columns selected')).toBeInTheDocument()
})

it('has role="status" with aria-live="polite"', () => {
  render(<SelectionSummary />)
  const el = screen.getByRole('status')
  expect(el).toBeInTheDocument()
  expect(el.getAttribute('aria-live')).toBe('polite')
})
