import { FC } from 'react'

interface TestConnectionBannerProps {
  status: 'idle' | 'connecting' | 'connected' | 'error'
  errorMessage: string | null
}

const TestConnectionBanner: FC<TestConnectionBannerProps> = ({ status, errorMessage }) => {
  if (status === 'idle') return null

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Testing connection…
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <div className="text-sm text-green-500 mt-3">
        Connection successful
      </div>
    )
  }

  return (
    <div className="text-sm text-destructive mt-3">
      {errorMessage}
    </div>
  )
}

export default TestConnectionBanner
