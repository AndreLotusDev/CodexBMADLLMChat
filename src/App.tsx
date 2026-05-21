import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import ConnectionScreen from '@/screens/ConnectionScreen'
import SchemaBrowserScreen from '@/screens/SchemaBrowserScreen'
import PromptPreviewScreen from '@/screens/PromptPreviewScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import ComposeScreen from '@/screens/ComposeScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/connection" replace />} />
        <Route path="connection" element={<ConnectionScreen />} />
        <Route path="schema" element={<SchemaBrowserScreen />} />
        <Route path="compose" element={<ComposeScreen />} />
        <Route path="prompt" element={<PromptPreviewScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
    </Routes>
  )
}

export default App
