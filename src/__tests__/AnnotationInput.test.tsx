import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AnnotationInput from '../components/schema/AnnotationInput'
import { useAppStore } from '../store/appStore'
import { buildAnnotationKey } from '../lib/utils'
import type { Annotation } from '../types'

beforeEach(() => {
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
    annotations: new Map<string, Annotation>(),
  })
})

it('renders a textarea with maxLength=500 and autoFocus', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i) as HTMLTextAreaElement
  expect(textarea).toBeInTheDocument()
  expect(textarea.maxLength).toBe(500)
  expect(textarea).toHaveFocus()
})

it('typing into the textarea writes to the store under the table-level key', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  const key = buildAnnotationKey('public', 'users', null)
  expect(useAppStore.getState().annotations.get(key)?.text).toBe('hello')
})

it('clearing the textarea to empty removes the annotation from the store', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  fireEvent.change(textarea, { target: { value: '' } })
  const key = buildAnnotationKey('public', 'users', null)
  expect(useAppStore.getState().annotations.has(key)).toBe(false)
})

it('whitespace-only text also removes the annotation', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  fireEvent.change(textarea, { target: { value: '   ' } })
  const key = buildAnnotationKey('public', 'users', null)
  expect(useAppStore.getState().annotations.has(key)).toBe(false)
})

it('character counter renders {N}/500 based on current text length', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  expect(screen.getByText('0/500')).toBeInTheDocument()
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'hello' } })
  expect(screen.getByText('5/500')).toBeInTheDocument()
})

it('clicking the Done button calls onClose', () => {
  const onClose = vi.fn()
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={onClose}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /done/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('pre-existing annotation seeds the textarea with the stored text', () => {
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
          text: 'preset',
          updatedAt: '2026-05-19T00:00:00Z',
        },
      ],
    ]),
  })
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName={null}
      onClose={() => {}}
    />,
  )
  expect((screen.getByLabelText(/Annotation for/i) as HTMLTextAreaElement).value).toBe('preset')
})

it('column-level annotation uses the column-level key', () => {
  render(
    <AnnotationInput
      schemaName="public"
      tableName="users"
      columnName="email"
      onClose={() => {}}
    />,
  )
  const textarea = screen.getByLabelText(/Annotation for/i)
  fireEvent.change(textarea, { target: { value: 'pk surrogate' } })
  expect(useAppStore.getState().annotations.get('public.users.email')?.text).toBe('pk surrogate')
})
