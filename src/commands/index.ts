import { invoke } from '@tauri-apps/api/core'
import type { ConnectionProfile, SaveProfileParams, SchemaTree, TestConnectionParams } from '../types'

export const commands = {
  testConnection: (params: TestConnectionParams): Promise<void> =>
    invoke<void>('test_connection', { ...params }),
  connectAndExtractSchema: (params: TestConnectionParams): Promise<SchemaTree> =>
    invoke<SchemaTree>('connect_and_extract_schema', { ...params }),
  disconnect: (): Promise<void> =>
    invoke<void>('disconnect'),
  listProfiles: (): Promise<ConnectionProfile[]> =>
    invoke<ConnectionProfile[]>('list_profiles'),
  saveProfile: (params: SaveProfileParams): Promise<ConnectionProfile> =>
    invoke<ConnectionProfile>('save_profile', { ...params }),
  deleteProfile: (profileId: string): Promise<void> =>
    invoke<void>('delete_profile', { profileId }),
  connectWithSavedProfile: (profileId: string): Promise<SchemaTree> =>
    invoke<SchemaTree>('connect_with_saved_profile', { profileId }),
}
