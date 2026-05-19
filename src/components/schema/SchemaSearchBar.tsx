import { ChangeEvent, FC, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useDebounce } from '@/hooks/useDebounce'

const SchemaSearchBar: FC = () => {
  const setSchemaFilter = useAppStore(s => s.setSchemaFilter)
  const [input, setInput] = useState('')

  const debouncedSetFilter = useDebounce((v: string) => setSchemaFilter(v), 200)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    debouncedSetFilter(e.target.value)
  }

  const handleClear = () => {
    debouncedSetFilter.cancel()
    setInput('')
    setSchemaFilter('')
  }

  return (
    <div className="relative px-3 py-2 border-b border-border shrink-0">
      <Search
        size={14}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        value={input}
        onChange={handleChange}
        placeholder="Search tables and columns..."
        aria-label="Search schema"
        className="w-full pl-7 pr-7 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {input && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export default SchemaSearchBar
