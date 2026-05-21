// Frontend-only synthetic error infrastructure for detecting when the page
// is loaded outside the Tauri WebView (e.g. `npm run dev` in a plain browser).
// The `TauriBridgeMissing` code below never crosses the IPC boundary — it is
// fabricated in TypeScript before `invoke()` is ever called, so it intentionally
// does NOT appear in `src-tauri/src/errors.rs`.

export const TAURI_BRIDGE_MISSING_MESSAGE =
  'This app must be launched via `npm run tauri dev` (or the installed desktop build). Browser-only mode cannot reach the database.'

export const TAURI_BRIDGE_MISSING_CODE = 'TauriBridgeMissing'

export function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
