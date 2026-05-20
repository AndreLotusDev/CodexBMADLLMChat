import { useCallback, useEffect, useMemo, useRef } from 'react'

export type DebouncedFunction<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  cancel: () => void
  flush: () => void
}

export function useDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): DebouncedFunction<TArgs> {
  const fnRef = useRef(fn)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgsRef = useRef<TArgs | null>(null)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const flush = useCallback(() => {
    if (timerRef.current !== null && lastArgsRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      fnRef.current(...lastArgsRef.current)
    }
  }, [])

  return useMemo(() => {
    const debounced = ((...args: TArgs) => {
      lastArgsRef.current = args
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        fnRef.current(...args)
      }, delayMs)
    }) as DebouncedFunction<TArgs>
    debounced.cancel = cancel
    debounced.flush = flush
    return debounced
  }, [delayMs, cancel, flush])
}
