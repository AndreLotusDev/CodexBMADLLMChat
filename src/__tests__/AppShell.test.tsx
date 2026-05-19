import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'

describe('AppShell', () => {
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
})
