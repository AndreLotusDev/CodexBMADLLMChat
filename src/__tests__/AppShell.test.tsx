import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'

describe('AppShell', () => {
  const win = window as unknown as { __TAURI_INTERNALS__?: object }

  it('renders all 4 nav links', () => {
    render(
      <MemoryRouter initialEntries={['/connection']}>
        <AppShell />
      </MemoryRouter>,
    )
    expect(screen.getByText('Connection')).toBeInTheDocument()
    expect(screen.getByText('Schema Browser')).toBeInTheDocument()
    expect(screen.getByText('Prompt Preview')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders main content outlet area', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/connection']}>
        <AppShell />
      </MemoryRouter>,
    )
    expect(container.querySelector('main')).toBeInTheDocument()
  })

  it('does NOT render the browser-only banner when Tauri bridge is present', () => {
    render(
      <MemoryRouter initialEntries={['/connection']}>
        <AppShell />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/browser-only preview/i)).toBeNull()
  })

  it('renders the browser-only banner when Tauri bridge is absent', () => {
    const saved = win.__TAURI_INTERNALS__
    delete win.__TAURI_INTERNALS__
    try {
      render(
        <MemoryRouter initialEntries={['/connection']}>
          <AppShell />
        </MemoryRouter>,
      )
      expect(screen.getByText(/browser-only preview/i)).toBeInTheDocument()
      expect(screen.getByText(/npm run tauri dev/i)).toBeInTheDocument()
    } finally {
      if (saved !== undefined) win.__TAURI_INTERNALS__ = saved
    }
  })
})
