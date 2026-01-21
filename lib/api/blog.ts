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
