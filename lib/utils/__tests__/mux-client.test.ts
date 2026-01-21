import { describe, it, expect, vi } from 'vitest'

describe('Mux client lazy init', () => {
  it('does not crash on import and rejects without env', async () => {
    const prevTokenId = process.env.MUX_TOKEN_ID
    const prevTokenSecret = process.env.MUX_TOKEN_SECRET
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    delete process.env.MUX_TOKEN_ID
    delete process.env.MUX_TOKEN_SECRET

    vi.resetModules()
    const { createDirectUpload } = await import('@/lib/mux/client')

    await expect(createDirectUpload()).rejects.toThrow('Mux credentials не настроены')

    consoleErrorSpy.mockRestore()
    if (prevTokenId !== undefined) process.env.MUX_TOKEN_ID = prevTokenId
    if (prevTokenSecret !== undefined) process.env.MUX_TOKEN_SECRET = prevTokenSecret
  })
})

