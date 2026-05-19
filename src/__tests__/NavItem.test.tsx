import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavItem from '../components/layout/NavItem'

describe('NavItem', () => {
  it('renders label text', () => {
    render(
      <MemoryRouter>
        <NavItem to="/connection" label="Connection" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Connection')).toBeInTheDocument()
  })

  it('applies active class when route matches', () => {
    render(
      <MemoryRouter initialEntries={['/connection']}>
        <NavItem to="/connection" label="Connection" />
      </MemoryRouter>,
    )
    const link = screen.getByText('Connection')
    expect(link).toHaveClass('bg-accent')
    expect(link).toHaveClass('text-accent-foreground')
  })

  it('does not apply active class when route does not match', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <NavItem to="/connection" label="Connection" />
      </MemoryRouter>,
    )
    const link = screen.getByText('Connection')
    expect(link).not.toHaveClass('bg-accent')
  })
})
