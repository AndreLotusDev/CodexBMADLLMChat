import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CopyButton from '../components/prompt/CopyButton'

const writeTextMock = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  writeTextMock.mockClear().mockResolvedValue(undefined)
  Object.assign(navigator, {
    clipboard: { writeText: writeTextMock },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CopyButton', () => {
  it('renders the idle label by default', () => {
    render(<CopyButton text="hello" />)
    expect(screen.getByRole('button', { name: /Copy to Clipboard/i })).toBeInTheDocument()
  })

  it('calls navigator.clipboard.writeText with the text prop on click and shows "Copied!"', async () => {
    render(<CopyButton text="my-prompt-content" />)
    const button = screen.getByRole('button', { name: /Copy to Clipboard/i })
    fireEvent.click(button)
    expect(writeTextMock).toHaveBeenCalledWith('my-prompt-content')
    expect(await screen.findByText('Copied!')).toBeInTheDocument()
  })

  it('reverts to idle label after 2 seconds (fake timers)', async () => {
    vi.useFakeTimers()
    render(<CopyButton text="hello" />)
    const button = screen.getByRole('button', { name: /Copy to Clipboard/i })
    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
    })
    expect(screen.getByText('Copied!')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument()
  })

  it('shows "Copy failed" when navigator.clipboard.writeText rejects', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('denied'))
    render(<CopyButton text="hello" />)
    const button = screen.getByRole('button', { name: /Copy to Clipboard/i })
    fireEvent.click(button)
    expect(await screen.findByText('Copy failed')).toBeInTheDocument()
  })

  it('reverts from error state to idle after 2 seconds', async () => {
    vi.useFakeTimers()
    writeTextMock.mockRejectedValueOnce(new Error('denied'))
    render(<CopyButton text="hello" />)
    const button = screen.getByRole('button', { name: /Copy to Clipboard/i })
    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByText('Copy failed')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument()
  })

  it('does not log warnings when unmounted before the timer fires', async () => {
    vi.useFakeTimers()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = render(<CopyButton text="hello" />)
    const button = screen.getByRole('button', { name: /Copy to Clipboard/i })
    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })
})
