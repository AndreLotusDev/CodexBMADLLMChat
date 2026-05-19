// Vitest global setup — mocks all Tauri IPC at module level.
// Every test file gets these mocks automatically via setupFiles in vite.config.ts.

import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}))
