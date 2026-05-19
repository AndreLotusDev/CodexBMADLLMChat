import { invoke } from '@tauri-apps/api/core'
import type { TestConnectionParams } from '../types'

export const commands = {
  testConnection: (params: TestConnectionParams): Promise<void> =>
    invoke<void>('test_connection', { ...params }),
}
