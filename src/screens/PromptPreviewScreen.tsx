import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/appStore'
import CopyButton from '@/components/prompt/CopyButton'

const PromptPreviewScreen: FC = () => {
  const navigate = useNavigate()
  const prompt = useAppStore((s) => s.prompt)

  if (prompt === null) {
    return (
      <div className="p-6 flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Prompt Preview</h1>
        <p className="text-sm text-muted-foreground">No prompt generated yet.</p>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate('/schema')}>
          Go to Schema Browser
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">Prompt Preview</h1>
          <p className="text-xs text-muted-foreground">
            {prompt.tableCount} {prompt.tableCount === 1 ? 'table' : 'tables'},{' '}
            {prompt.columnCount} {prompt.columnCount === 1 ? 'column' : 'columns'}
            {' '}— generated {new Date(prompt.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/schema')}>
            Back to Schema
          </Button>
          <CopyButton text={prompt.content} />
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4">
        <pre
          className="text-xs font-mono bg-muted/40 border border-border rounded p-4 whitespace-pre overflow-x-auto"
          aria-label="Generated prompt"
        >
          <code>{prompt.content}</code>
        </pre>
      </div>
    </div>
  )
}

export default PromptPreviewScreen
