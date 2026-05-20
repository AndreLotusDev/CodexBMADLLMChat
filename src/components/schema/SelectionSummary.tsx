import { FC } from 'react'
import { useAppStore } from '../../store/appStore'

const SelectionSummary: FC = () => {
  const tableCount = useAppStore(s => s.selectedTables.size)
  const columnCount = useAppStore(s => s.selectedColumns.size)

  const tableWord = tableCount === 1 ? 'table' : 'tables'
  const columnWord = columnCount === 1 ? 'column' : 'columns'

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-3 py-2 text-xs text-muted-foreground border-b border-border shrink-0"
    >
      {tableCount} {tableWord}, {columnCount} {columnWord} selected
    </div>
  )
}

export default SelectionSummary
