import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Checkbox } from '../components/ui/checkbox'

it('renders an input of type checkbox with the given aria-label', () => {
  render(<Checkbox aria-label="Select table users" />)
  const el = screen.getByRole('checkbox', { name: 'Select table users' })
  expect(el).toBeInTheDocument()
  expect((el as HTMLInputElement).type).toBe('checkbox')
})

it('calls onCheckedChange(true) when clicked from unchecked', () => {
  const onCheckedChange = vi.fn()
  render(<Checkbox checked={false} onCheckedChange={onCheckedChange} aria-label="cb" />)
  fireEvent.click(screen.getByRole('checkbox', { name: 'cb' }))
  expect(onCheckedChange).toHaveBeenCalledWith(true)
})

it('calls onCheckedChange(false) when clicked from checked', () => {
  const onCheckedChange = vi.fn()
  render(<Checkbox checked={true} onCheckedChange={onCheckedChange} aria-label="cb" />)
  fireEvent.click(screen.getByRole('checkbox', { name: 'cb' }))
  expect(onCheckedChange).toHaveBeenCalledWith(false)
})

it('reflects indeterminate prop on the DOM node', () => {
  render(<Checkbox checked={false} indeterminate={true} aria-label="cb" />)
  const el = screen.getByRole('checkbox', { name: 'cb' }) as HTMLInputElement
  expect(el.indeterminate).toBe(true)
})

it('does not render indeterminate as a literal HTML attribute', () => {
  render(<Checkbox checked={false} indeterminate={true} aria-label="cb" />)
  const el = screen.getByRole('checkbox', { name: 'cb' })
  // React sets the property via the ref effect, not as an attribute
  expect(el.hasAttribute('indeterminate')).toBe(false)
})

it('does not flag indeterminate on the DOM node when checked is true', () => {
  render(<Checkbox checked={true} indeterminate={true} aria-label="cb" />)
  const el = screen.getByRole('checkbox', { name: 'cb' }) as HTMLInputElement
  // When checked is true, the visual is "checked" — indeterminate property should not be active
  expect(el.indeterminate).toBe(false)
})

it('respects disabled prop', () => {
  render(<Checkbox disabled aria-label="cb" />)
  const el = screen.getByRole('checkbox', { name: 'cb' }) as HTMLInputElement
  expect(el.disabled).toBe(true)
})
