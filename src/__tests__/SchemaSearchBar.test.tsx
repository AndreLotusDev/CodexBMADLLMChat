import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SchemaSearchBar from '../components/schema/SchemaSearchBar'
import { useAppStore } from '../store/appStore'

describe('SchemaSearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useAppStore.setState({
      connectionStatus: 'idle',
      connectionError: null,
      schemaTree: null,
      schemaProgress: null,
      schemaFilter: '',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates local input immediately but writes to store only after the debounce delay', () => {
    render(<SchemaSearchBar />)
    const input = screen.getByLabelText('Search schema') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'use' } })
    expect(input.value).toBe('use')
    expect(useAppStore.getState().schemaFilter).toBe('')

    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(useAppStore.getState().schemaFilter).toBe('')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(useAppStore.getState().schemaFilter).toBe('use')
  })

  it('only the latest value reaches the store after rapid typing', () => {
    render(<SchemaSearchBar />)
    const input = screen.getByLabelText('Search schema') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'u' } })
    fireEvent.change(input, { target: { value: 'us' } })
    fireEvent.change(input, { target: { value: 'use' } })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(useAppStore.getState().schemaFilter).toBe('use')
  })

  it('clear button resets local input and immediately writes empty string to store', () => {
    render(<SchemaSearchBar />)
    const input = screen.getByLabelText('Search schema') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'users' } })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(useAppStore.getState().schemaFilter).toBe('users')

    const clearBtn = screen.getByLabelText('Clear search')
    fireEvent.click(clearBtn)

    expect(input.value).toBe('')
    expect(useAppStore.getState().schemaFilter).toBe('')
  })

  it('does not render the clear button when the input is empty', () => {
    render(<SchemaSearchBar />)
    expect(screen.queryByLabelText('Clear search')).toBeNull()
  })

  it('clear button cancels a pending debounced write (CLEAR-RACE regression)', () => {
    render(<SchemaSearchBar />)
    const input = screen.getByLabelText('Search schema') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'us' } })
    expect(input.value).toBe('us')
    expect(useAppStore.getState().schemaFilter).toBe('')

    const clearBtn = screen.getByLabelText('Clear search')
    fireEvent.click(clearBtn)

    expect(input.value).toBe('')
    expect(useAppStore.getState().schemaFilter).toBe('')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(useAppStore.getState().schemaFilter).toBe('')
  })
})
