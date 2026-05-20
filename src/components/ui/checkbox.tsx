import { ChangeEvent, FC, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  indeterminate?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  'aria-label'?: string
  className?: string
}

export const Checkbox: FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled,
  onCheckedChange,
  className,
  ...rest
}) => {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate && !checked
    }
  }, [indeterminate, checked])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked)
  }

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={handleChange}
      aria-label={rest['aria-label']}
      className={cn(
        'h-4 w-4 shrink-0 rounded border border-border bg-background',
        'text-foreground accent-foreground cursor-pointer',
        'focus:outline-none focus:ring-1 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    />
  )
}

export default Checkbox
