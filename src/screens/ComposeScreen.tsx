import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/appStore'
import { generatePrompt } from '@/lib/promptGenerator'
import RichTextEditor from '@/components/prompt/RichTextEditor'

const ComposeScreen: FC = () => {
  const navigate = useNavigate()
  const schemaTree = useAppStore(s => s.schemaTree)
  const selectedTables = useAppStore(s => s.selectedTables)
  const selectedColumns = useAppStore(s => s.selectedColumns)
  const annotations = useAppStore(s => s.annotations)
  const query = useAppStore(s => s.query)
  const expectedOutput = useAppStore(s => s.expectedOutput)
  const setQuery = useAppStore(s => s.setQuery)
  const setExpectedOutput = useAppStore(s => s.setExpectedOutput)
  const setPrompt = useAppStore(s => s.setPrompt)

  const canGenerate = schemaTree !== null && selectedTables.size > 0

  if (!canGenerate) {
    return (
      <div className="p-6 flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Compose Prompt</h1>
        <p className="text-sm text-muted-foreground">No tables selected yet.</p>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate('/schema')}>
          Back to Schema Browser
        </Button>
      </div>
    )
  }

  const handleGenerate = () => {
    if (schemaTree === null) return
    const block = generatePrompt(schemaTree, selectedTables, selectedColumns, annotations, query, expectedOutput)
    setPrompt(block)
    navigate('/prompt')
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold">Compose Prompt</h1>
          <p className="text-xs text-muted-foreground">
            {selectedTables.size} {selectedTables.size === 1 ? 'table' : 'tables'} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/schema')}>Back</Button>
          <Button variant="default" size="sm" onClick={handleGenerate}>Generate Prompt</Button>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">What do you want to ask?</h2>
          <p className="text-xs text-muted-foreground">
            The natural-language question that goes above the schema in your final prompt.
          </p>
          <RichTextEditor
            value={query}
            onChange={setQuery}
            placeholder="e.g., Write a SQL query that returns the top 10 customers by total order value in the last 30 days."
            ariaLabel="Natural language query"
          />
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">What kind of answer do you want back?</h2>
          <p className="text-xs text-muted-foreground">
            Optional. Describe the format or constraints the LLM should follow.
          </p>
          <RichTextEditor
            value={expectedOutput}
            onChange={setExpectedOutput}
            placeholder="e.g., A single SELECT statement with column aliases. Include a one-line comment above the query explaining the join."
            ariaLabel="Expected output"
          />
        </section>
      </div>
    </div>
  )
}

export default ComposeScreen
