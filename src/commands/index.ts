// IPC Gateway — ALL invoke() calls go through this module.
// No component should ever import @tauri-apps/api directly.
// Stub for Story 1.1 — commands added in subsequent stories.
import { invoke } from '@tauri-apps/api/core'

// Re-export invoke so consumers only depend on this gateway
export { invoke }

// Future commands will be exported as typed wrappers here, e.g.:
// export const commands = { ... }
