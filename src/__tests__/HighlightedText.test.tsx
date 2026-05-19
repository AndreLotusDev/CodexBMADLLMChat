import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import HighlightedText from '../components/schema/HighlightedText'

describe('HighlightedText', () => {
  it('renders raw text and no <mark> when the query is empty', () => {
    const { container } = render(<HighlightedText text="users" query="" />)
    expect(container.textContent).toBe('users')
    expect(container.querySelector('mark')).toBeNull()
  })

  it('renders raw text and no <mark> when the query is only whitespace', () => {
    const { container } = render(<HighlightedText text="users" query="   " />)
    expect(container.textContent).toBe('users')
    expect(container.querySelector('mark')).toBeNull()
  })

  it('wraps the matched substring in <mark> with surrounding text preserved', () => {
    const { container } = render(<HighlightedText text="user_orders" query="order" />)
    const mark = container.querySelector('mark')
    expect(mark).not.toBeNull()
    expect(mark!.textContent).toBe('order')
    expect(container.textContent).toBe('user_orders')
  })

  it('matches case-insensitively but preserves original casing inside <mark>', () => {
    const { container } = render(<HighlightedText text="Users" query="user" />)
    const mark = container.querySelector('mark')
    expect(mark).not.toBeNull()
    expect(mark!.textContent).toBe('User')
    expect(container.textContent).toBe('Users')
  })

  it('renders raw text with no <mark> when the query does not match', () => {
    const { container } = render(<HighlightedText text="users" query="xyz" />)
    expect(container.textContent).toBe('users')
    expect(container.querySelector('mark')).toBeNull()
  })
})
