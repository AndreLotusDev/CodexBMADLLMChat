import { invoke, type InvokeArgs } from '@tauri-apps/api/core'
import type {
  Annotation,
  ConnectionProfile,
  SaveProfileParams,
  SchemaTree,
  TestConnectionParams,
  UpsertAnnotationParams,
} from '../types'
import {
  isTauriAvailable,
  TAURI_BRIDGE_MISSING_CODE,
  TAURI_BRIDGE_MISSING_MESSAGE,
} from '../lib/tauriBridge'

function invokeOrReject<T>(name: string, args?: InvokeArgs): Promise<T> {
  if (!isTauriAvailable()) {
    return Promise.reject({
      code: TAURI_BRIDGE_MISSING_CODE,
      message: TAURI_BRIDGE_MISSING_MESSAGE,
    })
  }
  return args === undefined ? invoke<T>(name) : invoke<T>(name, args)
}

export const commands = {
  testConnection: (params: TestConnectionParams): Promise<void> =>
    invokeOrReject<void>('test_connection', { ...params }),
  connectAndExtractSchema: (params: TestConnectionParams): Promise<SchemaTree> =>
    invokeOrReject<SchemaTree>('connect_and_extract_schema', { ...params }),
  disconnect: (): Promise<void> =>
    invokeOrReject<void>('disconnect'),
  listProfiles: (): Promise<ConnectionProfile[]> =>
    invokeOrReject<ConnectionProfile[]>('list_profiles'),
  saveProfile: (params: SaveProfileParams): Promise<ConnectionProfile> =>
    invokeOrReject<ConnectionProfile>('save_profile', { ...params }),
  deleteProfile: (profileId: string): Promise<void> =>
    invokeOrReject<void>('delete_profile', { profileId }),
  renameProfile: (profileId: string, newName: string): Promise<void> =>
    invokeOrReject<void>('rename_profile', { profileId, newName }),
  connectWithSavedProfile: (profileId: string): Promise<SchemaTree> =>
    invokeOrReject<SchemaTree>('connect_with_saved_profile', { profileId }),
  loadAnnotations: (profileId: string): Promise<Annotation[]> =>
    invokeOrReject<Annotation[]>('load_annotations', { profileId }),
  upsertAnnotation: (params: UpsertAnnotationParams): Promise<Annotation> =>
    invokeOrReject<Annotation>('upsert_annotation', { ...params }),
  deleteAnnotation: (annotationId: string): Promise<void> =>
    invokeOrReject<void>('delete_annotation', { annotationId }),
}
