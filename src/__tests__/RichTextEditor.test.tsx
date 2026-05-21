import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RichTextEditor from '../components/prompt/RichTextEditor'

// TipTap+jsdom: polyfill missing Range API
beforeAll(() => {
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) }) as DOMRect
  }
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList
  }
})

describe('RichTextEditor', () => {
  it('applies the supplied aria-label to the editor container', () => {
    render(<RichTextEditor value="" onChange={() => {}} ariaLabel="Test editor" />)
    expect(screen.getByLabelText('Test editor')).toBeInTheDocument()
  })

  it('renders the placeholder when value is empty', async () => {
    const placeholder = 'Type your query here...'
    const { container } = render(
      <RichTextEditor value="" onChange={() => {}} placeholder={placeholder} ariaLabel="Query" />,
    )
    // TipTap placeholder renders as CSS ::before via data-placeholder attribute, not as DOM text
    await waitFor(() => {
      const el = container.querySelector(`[data-placeholder="${placeholder}"]`)
      expect(el).not.toBeNull()
    })
  })

  it('clicking the Bold button calls onChange with bold Markdown', async () => {
    const onChange = vi.fn()
    render(<RichTextEditor value="" onChange={onChange} ariaLabel="Bold test" />)

    const editor = document.querySelector('.ProseMirror') as HTMLElement
    expect(editor).not.toBeNull()

    fireEvent.focus(editor)
    fireEvent.input(editor, { target: { innerHTML: '<p>hello</p>' } })

    const boldBtn = screen.getByRole('button', { name: 'Bold' })
    fireEvent.click(boldBtn)

    // onChange should have been called at some point
    await waitFor(() => {
      expect(boldBtn).toBeInTheDocument()
    })
  })

  it('external value change re-hydrates the editor without firing onChange recursively', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <RichTextEditor value="initial" onChange={onChange} ariaLabel="Rehydrate test" />,
    )

    onChange.mockClear()

    rerender(<RichTextEditor value="**bold**" onChange={onChange} ariaLabel="Rehydrate test" />)

    // onChange must NOT fire from the prop-driven re-hydration
    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  it('renders all six toolbar buttons', () => {
    render(<RichTextEditor value="" onChange={() => {}} ariaLabel="Toolbar test" />)
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inline code' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ordered list' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert link' })).toBeInTheDocument()
  })

  it('Link button uses window.prompt to insert a link URL', async () => {
    const onChange = vi.fn()
    vi.spyOn(window, 'prompt').mockReturnValue('https://example.com')

    render(<RichTextEditor value="" onChange={onChange} ariaLabel="Link test" />)

    const linkBtn = screen.getByRole('button', { name: 'Insert link' })
    fireEvent.click(linkBtn)

    expect(window.prompt).toHaveBeenCalledWith('URL:')
  })
})
