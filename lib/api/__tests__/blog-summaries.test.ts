import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getBlogSummaries, toBlogSummaries, type BlogPost } from '../blog'

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '1',
    title: 'Статья',
    slug: 'statya',
    excerpt: null,
    category: null,
    author: null,
    reading_time: '3 мин',
    content: 'Очень длинный текст статьи',
    cover_image: null,
    is_featured: false,
    is_published: true,
    published_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('списки блога без текстов статей', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('toBlogSummaries обнуляет content и сохраняет остальные поля', () => {
    const [summary] = toBlogSummaries([post()])

    expect(summary?.content).toBeNull()
    expect(summary?.title).toBe('Статья')
    expect(summary?.reading_time).toBe('3 мин')
  })

  it('getBlogSummaries просит у API include_content=false и обнуляет content, даже если бэкенд его прислал', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([post()]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const result = await getBlogSummaries(true)

    const [url] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/blog\?published=true&include_content=false$/)
    expect(result[0]?.content).toBeNull()
  })
})
