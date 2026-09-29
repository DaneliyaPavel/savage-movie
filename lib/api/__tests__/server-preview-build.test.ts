import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../base', () => ({
  baseApiRequest: vi.fn().mockRejectedValue(new Error('Не удалось подключиться к серверу')),
}))

import { apiGet } from '../server'

describe('apiGet при недоступном backend', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('на сборке превью Vercel отдаёт пустой результат', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(apiGet('/api/projects')).resolves.toEqual([])
  })

  it('в остальных окружениях пробрасывает ошибку, как раньше', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    await expect(apiGet('/api/projects')).rejects.toThrow('Не удалось подключиться')

    vi.stubEnv('VERCEL_ENV', '')
    await expect(apiGet('/api/projects')).rejects.toThrow('Не удалось подключиться')

    // Preview, но уже во время работы, а не сборки: ISR не должен получать пустоту
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('NEXT_PHASE', '')
    await expect(apiGet('/api/projects')).rejects.toThrow('Не удалось подключиться')
  })
})
