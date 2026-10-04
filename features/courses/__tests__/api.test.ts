/**
 * Курсы: ссылки на видео уроков приходят только из закрытого /content.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken, setAccessToken } from '@/lib/api/token-store'
import { getCourseById, getCourseBySlugServer, getCourseContentServer, getCourses } from '../api'

const COURSE_ID = '8b0d4b6e-6c0b-4c53-9a53-0a7a8f4b6c11'
const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function calls(): { url: string; authorization: string | null }[] {
  return fetchMock.mock.calls.map(([url, init]) => ({
    url: String(url),
    authorization: new Headers((init as RequestInit | undefined)?.headers).get('Authorization'),
  }))
}

describe('features/courses/api: закрытый контент курса', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    setAccessToken(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  describe('getCourseById (редактор админки)', () => {
    it('идёт в закрытый /content с токеном из памяти', async () => {
      setAccessToken('admin-jwt')
      fetchMock.mockResolvedValueOnce(jsonResponse({ id: COURSE_ID, modules: [] }))

      await expect(getCourseById(COURSE_ID)).resolves.toMatchObject({ id: COURSE_ID })

      const [call] = calls()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(call.url.endsWith(`/api/courses/${COURSE_ID}/content`)).toBe(true)
      expect(call.authorization).toBe('Bearer admin-jwt')
    })

    it('после жёсткой перезагрузки сначала подтягивает токен из /api/auth/session', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: 'cookie-jwt' }))
        .mockResolvedValueOnce(jsonResponse({ id: COURSE_ID, modules: [] }))

      await getCourseById(COURSE_ID)

      const [session, content] = calls()
      expect(session.url).toBe('/api/auth/session')
      expect(content.url.endsWith(`/api/courses/${COURSE_ID}/content`)).toBe(true)
      expect(content.authorization).toBe('Bearer cookie-jwt')
      expect(getAccessToken()).toBe('cookie-jwt')
    })

    it('без сессии падает с 401 и не откатывается на публичный GET без video_url', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ access_token: null }))
        .mockResolvedValueOnce(jsonResponse({ detail: 'Требуется аутентификация' }, 401))

      await expect(getCourseById(COURSE_ID)).rejects.toThrow('Требуется аутентификация')

      const urls = calls().map(c => c.url)
      expect(urls.some(url => url.endsWith(`/api/courses/${COURSE_ID}`))).toBe(false)
      expect(urls.filter(url => url.includes('/api/courses/'))).toHaveLength(1)
    })

    it('сбой /api/auth/session не маскируется: запрос уходит и получает 401', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(jsonResponse({ detail: 'Требуется аутентификация' }, 401))

      await expect(getCourseById(COURSE_ID)).rejects.toThrow('Требуется аутентификация')
    })
  })

  describe('публичные запросы', () => {
    it('getCourses и getCourseBySlugServer не трогают /content', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(jsonResponse({ id: COURSE_ID, modules: [] }))

      await getCourses()
      await getCourseBySlugServer('paid')

      const urls = calls().map(c => c.url)
      expect(urls[0].endsWith('/api/courses')).toBe(true)
      expect(urls[1].endsWith('/api/courses/paid')).toBe(true)
      expect(urls.some(url => url.endsWith('/content'))).toBe(false)
    })
  })

  describe('getCourseContentServer (кабинет студента)', () => {
    it('идёт в /content и передаёт токен из cookies', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ id: COURSE_ID, modules: [] }))
      const cookies = {
        get: (name: string) => (name === 'access_token' ? { value: 'student-jwt' } : undefined),
      }

      await getCourseContentServer(COURSE_ID, cookies)

      const [call] = calls()
      expect(call.url.endsWith(`/api/courses/${COURSE_ID}/content`)).toBe(true)
      expect(call.authorization).toBe('Bearer student-jwt')
    })

    it('без cookies запрос уходит без токена (backend ответит 401)', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'Требуется аутентификация' }, 401))

      await expect(getCourseContentServer(COURSE_ID)).rejects.toThrow('Требуется аутентификация')
      expect(calls()[0].authorization).toBeNull()
    })
  })
})
