import { invoke } from '@tauri-apps/api/core'
import type { TestConnectionParams, SchemaTree } from '../types'

export const commands = {
  testConnection: (params: TestConnectionParams): Promise<void> =>
    invoke<void>('test_connection', { ...params }),
  connectAndExtractSchema: (params: TestConnectionParams): Promise<SchemaTree> =>
    invoke<SchemaTree>('connect_and_extract_schema', { ...params }),
  disconnect: (): Promise<void> =>
    invoke<void>('disconnect'),
}
