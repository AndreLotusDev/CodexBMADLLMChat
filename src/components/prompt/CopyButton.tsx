import { FC, useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  text: string
}

type State = 'idle' | 'copied' | 'error'

const CopyButton: FC<CopyButtonProps> = ({ text }) => {
  const [state, setState] = useState<State>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const handleClick = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('error')
    }
    timerRef.current = setTimeout(() => setState('idle'), 2000)
  }

  const label =
    state === 'copied' ? 'Copied!' : state === 'error' ? 'Copy failed' : 'Copy to Clipboard'
  const Icon = state === 'copied' ? Check : state === 'error' ? AlertCircle : Copy

  return (
    <Button onClick={handleClick} variant="default" size="sm" aria-live="polite">
      <Icon size={14} className="mr-2" />
      {label}
    </Button>
  )
}

export default CopyButton
