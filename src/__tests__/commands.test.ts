import { invoke } from '@tauri-apps/api/core'
import { commands } from '../commands'

const mockInvoke = invoke as ReturnType<typeof vi.fn>

// setup.ts seeds `window.__TAURI_INTERNALS__` for the whole suite. These tests
// flip it per-case to assert the guard in src/commands/index.ts.

describe('commands IPC bridge guard', () => {
  const win = window as unknown as { __TAURI_INTERNALS__?: object }

  beforeEach(() => {
    mockInvoke.mockReset()
  })

  it('rejects with TauriBridgeMissing when window.__TAURI_INTERNALS__ is absent', async () => {
    const saved = win.__TAURI_INTERNALS__
    delete win.__TAURI_INTERNALS__
    try {
      await expect(
        commands.testConnection({
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          username: 'postgres',
          password: 'secret',
        }),
      ).rejects.toMatchObject({
        code: 'TauriBridgeMissing',
        message: expect.stringContaining('tauri dev'),
      })
      expect(mockInvoke).not.toHaveBeenCalled()
    } finally {
      if (saved !== undefined) win.__TAURI_INTERNALS__ = saved
    }
  })

  it('passes through to invoke when window.__TAURI_INTERNALS__ is present', async () => {
    win.__TAURI_INTERNALS__ = {}
    mockInvoke.mockResolvedValueOnce(undefined)
    await expect(
      commands.testConnection({
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        username: 'postgres',
        password: 'secret',
      }),
    ).resolves.toBeUndefined()
    expect(mockInvoke).toHaveBeenCalledWith('test_connection', {
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      username: 'postgres',
      password: 'secret',
    })
  })
})
