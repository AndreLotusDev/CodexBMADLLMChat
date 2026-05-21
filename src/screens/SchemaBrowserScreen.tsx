import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { commands } from '@/commands'
import { useAppStore } from '@/store/appStore'
import SchemaTree from '@/components/schema/SchemaTree'
import SchemaSearchBar from '@/components/schema/SchemaSearchBar'
import SelectionSummary from '@/components/schema/SelectionSummary'

const SchemaBrowserScreen: FC = () => {
  const navigate = useNavigate()
  const schemaTree = useAppStore(s => s.schemaTree)
  const clearConnection = useAppStore(s => s.clearConnection)
  const selectedTables = useAppStore(s => s.selectedTables)

  const handleDisconnect = async () => {
    await commands.disconnect()
    clearConnection()
    navigate('/connection')
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Schema Browser</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            disabled={selectedTables.size === 0}
            onClick={() => navigate('/compose')}
          >
            Next: Compose Prompt
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </header>

      {schemaTree !== null && <SchemaSearchBar />}
      {schemaTree !== null && <SelectionSummary />}

      <div className="flex-1 overflow-auto">
        {schemaTree === null ? (
          <div className="p-6 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">No active connection.</p>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate('/connection')}>
              Go to Connection
            </Button>
          </div>
        ) : (
          <SchemaTree tree={schemaTree} />
        )}
      </div>
    </div>
  )
}

export default SchemaBrowserScreen
