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

// Stub the Tauri bridge marker so the `isTauriAvailable()` guard in
// src/commands/index.ts sees the bridge as present. Tests that need to
// simulate browser-only mode delete this on `window` per-test.
;(window as unknown as { __TAURI_INTERNALS__: object }).__TAURI_INTERNALS__ = {}
