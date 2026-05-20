import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PromptPreviewScreen from '../screens/PromptPreviewScreen'
import { useAppStore } from '../store/appStore'
import type { Annotation, PromptBlock } from '../types'

const writeTextMock = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  writeTextMock.mockClear().mockResolvedValue(undefined)
  Object.assign(navigator, {
    clipboard: { writeText: writeTextMock },
  })
  useAppStore.setState({
    connectionStatus: 'idle',
    connectionError: null,
    schemaTree: null,
    schemaProgress: null,
    schemaFilter: '',
    selectedTables: new Set<string>(),
    selectedColumns: new Set<string>(),
    annotations: new Map<string, Annotation>(),
    prompt: null,
    isGenerating: false,
  })
})

const renderScreen = () =>
  render(
    <MemoryRouter>
      <PromptPreviewScreen />
    </MemoryRouter>,
  )

describe('PromptPreviewScreen', () => {
  it('renders the empty state when prompt is null', () => {
    renderScreen()
    expect(screen.getByText('No prompt generated yet.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Go to Schema Browser/i }),
    ).toBeInTheDocument()
  })

  it('renders the populated state with singular table/column counts', () => {
    const sample: PromptBlock = {
      content:
        'Here is my database schema:\n\nCREATE TABLE public.users (\n    id integer NOT NULL\n);\n',
      tableCount: 1,
      columnCount: 1,
      generatedAt: '2026-05-20T00:00:00.000Z',
    }
    useAppStore.setState({ prompt: sample })
    renderScreen()
    expect(screen.getByText(/1 table,\s*1 column/i)).toBeInTheDocument()
    const pre = screen.getByLabelText('Generated prompt')
    expect(pre.textContent).toContain('CREATE TABLE public.users')
    expect(screen.getByRole('button', { name: /Copy to Clipboard/i })).toBeInTheDocument()
  })

  it('uses plural forms when counts are not 1', () => {
    const sample: PromptBlock = {
      content: 'Here is my database schema:\n\n',
      tableCount: 3,
      columnCount: 12,
      generatedAt: '2026-05-20T00:00:00.000Z',
    }
    useAppStore.setState({ prompt: sample })
    renderScreen()
    expect(screen.getByText(/3 tables,\s*12 columns/i)).toBeInTheDocument()
  })

  it('renders the <pre> with whitespace-pre to preserve DDL indentation', () => {
    const sample: PromptBlock = {
      content: 'Here is my database schema:\n\n    indented\n',
      tableCount: 0,
      columnCount: 0,
      generatedAt: '2026-05-20T00:00:00.000Z',
    }
    useAppStore.setState({ prompt: sample })
    renderScreen()
    const pre = screen.getByLabelText('Generated prompt')
    expect(pre.className).toContain('whitespace-pre')
  })
})
