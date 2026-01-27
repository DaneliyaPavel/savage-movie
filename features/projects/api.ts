/**
 * API функции для проектов
 */
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client'
import type { ProjectOrientation } from './utils'

export interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  client: string | null
  category: 'commercial' | 'ai-content' | 'music-video' | 'other'
  video_url: string | null
  orientation?: ProjectOrientation | null
  images: string[] | null
  duration: number | null
  role: string | null
  tools: string[] | null
  behind_scenes: string[] | null
  is_featured: boolean
  mux_playback_id: string | null
  title_ru: string | null
  title_en: string | null
  description_ru: string | null
  description_en: string | null
  thumbnail_url: string | null
  cover_image_url: string | null
  year: number | null
  display_order: number | null
  created_at: string
  updated_at: string
}

/**
 * Получить список проектов (client-side)
 */
export async function getProjects(category?: string, featured?: boolean): Promise<Project[]> {
  const params = new URLSearchParams()
  if (category && category !== 'all') {
    params.append('category', category)
  }
  if (featured !== undefined) {
    params.append('featured', featured.toString())
  }
  const queryString = params.toString()
  return apiGet<Project[]>(`/api/projects${queryString ? `?${queryString}` : ''}`)
}

/**
 * Получить список проектов (server-side)
 */
export async function getProjectsServer(
  category?: string, 
  featured?: boolean,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Project[]> {
  const { apiGet: apiGetServer } = await import('@/lib/api/server')
  const params = new URLSearchParams()
  if (category && category !== 'all') {
    params.append('category', category)
  }
  if (featured !== undefined) {
    params.append('featured', featured.toString())
  }
  const queryString = params.toString()
  return apiGetServer<Project[]>(`/api/projects${queryString ? `?${queryString}` : ''}`, cookies)
}

/**
 * Получить проект по slug (client-side)
 */
export async function getProjectBySlug(slug: string): Promise<Project> {
  return apiGet<Project>(`/api/projects/${slug}`)
}

/**
 * Получить проект по slug (server-side)
 */
export async function getProjectBySlugServer(
  slug: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Project> {
  const { apiGet: apiGetServer } = await import('@/lib/api/server')
  return apiGetServer<Project>(`/api/projects/${slug}`, cookies)
}

export interface ProjectCreate {
  title: string
  slug: string
  description?: string | null
  client?: string | null
  category: 'commercial' | 'ai-content' | 'music-video' | 'other'
  video_url?: string | null
  orientation?: ProjectOrientation | null
  images?: string[] | null
  duration?: number | null
  role?: string | null
  tools?: string[] | null
  behind_scenes?: string[] | null
  is_featured?: boolean
  mux_playback_id?: string | null
  title_ru?: string | null
  title_en?: string | null
  description_ru?: string | null
  description_en?: string | null
  thumbnail_url?: string | null
  cover_image_url?: string | null
  year?: number | null
}

export interface ProjectUpdate {
  title?: string
  slug?: string
  description?: string | null
  client?: string | null
  category?: 'commercial' | 'ai-content' | 'music-video' | 'other'
  video_url?: string | null
  orientation?: ProjectOrientation | null
  images?: string[] | null
  duration?: number | null
  role?: string | null
  tools?: string[] | null
  behind_scenes?: string[] | null
  is_featured?: boolean
  mux_playback_id?: string | null
  title_ru?: string | null
  title_en?: string | null
  description_ru?: string | null
  description_en?: string | null
  thumbnail_url?: string | null
  cover_image_url?: string | null
  year?: number | null
  display_order?: number | null
}

/**
 * Обновить порядок проектов
 */
export async function updateProjectsOrder(updates: Array<{ id: string; display_order: number }>): Promise<void> {
  return apiPost<void>('/api/projects/reorder', { updates })
}

/**
 * Создать проект
 */
export async function createProject(data: ProjectCreate): Promise<Project> {
  return apiPost<Project>('/api/projects', data)
}

/**
 * Обновить проект
 */
export async function updateProject(id: string, data: ProjectUpdate): Promise<Project> {
  return apiPut<Project>(`/api/projects/${id}`, data)
}

/**
 * Удалить проект
 */
export async function deleteProject(id: string): Promise<void> {
  return apiDelete<void>(`/api/projects/${id}`)
}
