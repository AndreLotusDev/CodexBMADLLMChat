import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { commands } from '@/commands'
import { useAppStore } from '@/store/appStore'
import type { TauriCommandError } from '@/types'
import TestConnectionBanner from './TestConnectionBanner'

const ConnectionForm: FC = () => {
  const navigate = useNavigate()
  const [host, setHost] = useState('')
  const [port, setPort] = useState('5432')
  const [database, setDatabase] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const connectionStatus = useAppStore(s => s.connectionStatus)
  const setConnectionStatus = useAppStore(s => s.setConnectionStatus)
  const connectionError = useAppStore(s => s.connectionError)
  const schemaProgress = useAppStore(s => s.schemaProgress)
  const setSchemaTree = useAppStore(s => s.setSchemaTree)
  const setSchemaProgress = useAppStore(s => s.setSchemaProgress)

  const portNum = parseInt(port, 10)
  const isPortValid = !isNaN(portNum) && portNum >= 1 && portNum <= 65535

  const isFormFilled =
    host.trim() !== '' &&
    isPortValid &&
    database.trim() !== '' &&
    username.trim() !== '' &&
    password.trim() !== ''

  const handleSubmit = async () => {
    setConnectionStatus('connecting')
    try {
      await commands.testConnection({
        host: host.trim(),
        port: portNum,
        database: database.trim(),
        username: username.trim(),
        password,
      })
      setConnectionStatus('connected')
    } catch (err) {
      const tauri = err as TauriCommandError
      setConnectionStatus('error', tauri?.message ?? String(err))
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="host">Host</Label>
        <Input
          id="host"
          value={host}
          onChange={e => setHost(e.target.value)}
          placeholder="localhost"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="port">Port</Label>
        <Input
          id="port"
          value={port}
          onChange={e => setPort(e.target.value)}
          placeholder="5432"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="database">Database</Label>
        <Input
          id="database"
          value={database}
          onChange={e => setDatabase(e.target.value)}
          placeholder="mydb"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="postgres"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pr-9"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isFormFilled || connectionStatus === 'connecting'}
      >
        {connectionStatus === 'connecting' ? 'Testing…' : 'Test Connection'}
      </Button>

      <TestConnectionBanner status={connectionStatus} errorMessage={connectionError} />

      {connectionStatus === 'connected' && (
        <div className="flex flex-col gap-2">
          <Button
            onClick={async () => {
              setIsConnecting(true)
              setSchemaProgress(null)
              try {
                const tree = await commands.connectAndExtractSchema({
                  host: host.trim(),
                  port: portNum,
                  database: database.trim(),
                  username: username.trim(),
                  password,
                })
                setSchemaTree(tree)
                navigate('/schema')
              } catch (err) {
                setConnectionStatus('error', (err as TauriCommandError).message ?? 'Connection failed')
              } finally {
                setIsConnecting(false)
              }
            }}
            disabled={isConnecting}
          >
            {isConnecting ? 'Loading schema…' : 'Connect & Browse Schema'}
          </Button>
          {isConnecting && schemaProgress !== null && (
            <p className="text-sm text-muted-foreground">
              Loaded {schemaProgress.loaded}/{schemaProgress.total} tables…
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ConnectionForm
