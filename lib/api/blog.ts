/**
 * API функции для блога
 */
import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  author: string | null
  reading_time: string | null
  content: string | null
  cover_image: string | null
  is_featured: boolean
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BlogPostCreate {
  title: string
  slug: string
  excerpt?: string | null
  category?: string | null
  author?: string | null
  reading_time?: string | null
  content?: string | null
  cover_image?: string | null
  is_featured?: boolean
  is_published?: boolean
  published_at?: string | null
}

export interface BlogPostUpdate {
  title?: string
  slug?: string
  excerpt?: string | null
  category?: string | null
  author?: string | null
  reading_time?: string | null
  content?: string | null
  cover_image?: string | null
  is_featured?: boolean
  is_published?: boolean
  published_at?: string | null
}

export async function getBlogPosts(published?: boolean): Promise<BlogPost[]> {
  const params = new URLSearchParams()
  if (published !== undefined) {
    params.append('published', published.toString())
  }
  const query = params.toString()
  return apiGet<BlogPost[]>(`/api/blog${query ? `?${query}` : ''}`)
}

/**
 * Карточка статьи для списков: то же, что BlogPost, но без текста.
 * Текст статьи — десятки КБ на статью (12 статей ≈ 85 КБ несжатого JSON), а списку
 * (лента блога, «похожие статьи», счётчик в меню) он не нужен.
 */
export type BlogPostSummary = Omit<BlogPost, 'content'> & { content: null }

/**
 * Список без текстов. Бэкенд сам не отдаёт `content` по `include_content=false`;
 * `content: null` выставляется и здесь, чтобы старый бэкенд (параметр не знает и шлёт
 * тексты) не раздувал ни ответ, ни payload страницы, в который Next кладёт props
 * клиентских компонентов.
 */
export function toBlogSummaries(posts: BlogPost[]): BlogPostSummary[] {
  return posts.map(post => ({ ...post, content: null }))
}

function blogListQuery(published?: boolean): string {
  const params = new URLSearchParams()
  if (published !== undefined) {
    params.append('published', published.toString())
  }
  params.append('include_content', 'false')
  return params.toString()
}

export async function getBlogSummaries(published?: boolean): Promise<BlogPostSummary[]> {
  return toBlogSummaries(await apiGet<BlogPost[]>(`/api/blog?${blogListQuery(published)}`))
}

export async function getBlogSummariesServer(
  published?: boolean,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<BlogPostSummary[]> {
  const { apiGet: apiGetServer } = await import('./server')
  return toBlogSummaries(
    await apiGetServer<BlogPost[]>(`/api/blog?${blogListQuery(published)}`, cookies)
  )
}

export async function getBlogPost(id: string): Promise<BlogPost> {
  return apiGet<BlogPost>(`/api/blog/by-id/${id}`)
}

export async function getBlogPostsServer(
  published?: boolean,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<BlogPost[]> {
  const { apiGet: apiGetServer } = await import('./server')
  const params = new URLSearchParams()
  if (published !== undefined) {
    params.append('published', published.toString())
  }
  const query = params.toString()
  return apiGetServer<BlogPost[]>(`/api/blog${query ? `?${query}` : ''}`, cookies)
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost> {
  return apiGet<BlogPost>(`/api/blog/${slug}`)
}

export async function getBlogPostBySlugServer(
  slug: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<BlogPost> {
  const { apiGet: apiGetServer } = await import('./server')
  return apiGetServer<BlogPost>(`/api/blog/${slug}`, cookies)
}

export async function createBlogPost(data: BlogPostCreate): Promise<BlogPost> {
  return apiPost<BlogPost>('/api/blog', data)
}

export async function updateBlogPost(id: string, data: BlogPostUpdate): Promise<BlogPost> {
  return apiPut<BlogPost>(`/api/blog/${id}`, data)
}

export async function deleteBlogPost(id: string): Promise<void> {
  return apiDelete<void>(`/api/blog/${id}`)
}
