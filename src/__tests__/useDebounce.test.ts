import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not invoke the callback before the delay elapses', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 200))

    act(() => {
      result.current('a')
    })

    expect(fn).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(fn).not.toHaveBeenCalled()
  })

  it('invokes the callback once after the delay with the latest argument', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 200))

    act(() => {
      result.current('a')
      result.current('b')
      result.current('c')
    })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('clears pending timer on unmount', () => {
    const fn = vi.fn()
    const { result, unmount } = renderHook(() => useDebounce(fn, 200))

    act(() => {
      result.current('x')
    })
    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(fn).not.toHaveBeenCalled()
  })
})
