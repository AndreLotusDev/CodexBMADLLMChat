import { useCallback, useEffect, useMemo, useRef } from 'react'

export type DebouncedFunction<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  cancel: () => void
}

export function useDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): DebouncedFunction<TArgs> {
  const fnRef = useRef(fn)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return useMemo(() => {
    const debounced = ((...args: TArgs) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fnRef.current(...args), delayMs)
    }) as DebouncedFunction<TArgs>
    debounced.cancel = cancel
    return debounced
  }, [delayMs, cancel])
}
