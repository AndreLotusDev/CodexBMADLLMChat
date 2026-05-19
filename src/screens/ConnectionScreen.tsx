import { FC } from 'react'
import ConnectionForm from '@/components/connection/ConnectionForm'

const ConnectionScreen: FC = () => {
  return (
    <div className="bg-background text-foreground p-6">
      <h1 className="text-2xl font-bold mb-6">Connection</h1>
      <ConnectionForm />
    </div>
  )
}

export default ConnectionScreen
