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
  carousel_gif_url: string | null
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
 * Получить проект по ID (client-side)
 */
export async function getProjectById(id: string): Promise<Project> {
  return apiGet<Project>(`/api/projects/${id}`)
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
  carousel_gif_url?: string | null
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
  carousel_gif_url?: string | null
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
 * Дополнительное видео проекта
 */
export interface ProjectVideo {
  id: string
  project_id: string
  title: string | null
  mux_playback_id: string
  orientation: 'horizontal' | 'vertical'
  display_order: number
  created_at: string
}

export interface ProjectVideoCreate {
  title?: string | null
  mux_playback_id: string
  orientation?: string
  display_order?: number
}

export interface ProjectVideoUpdate {
  title?: string | null
  mux_playback_id?: string
  orientation?: string
  display_order?: number
}

/**
 * Получить дополнительные видео проекта
 */
export async function getProjectVideos(projectId: string): Promise<ProjectVideo[]> {
  return apiGet<ProjectVideo[]>(`/api/projects/${projectId}/videos`)
}

/**
 * Получить дополнительные видео проекта (server-side)
 */
export async function getProjectVideosServer(
  projectId: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<ProjectVideo[]> {
  const { apiGet: apiGetServer } = await import('@/lib/api/server')
  return apiGetServer<ProjectVideo[]>(`/api/projects/${projectId}/videos`, cookies)
}

/**
 * Добавить видео к проекту
 */
export async function createProjectVideo(
  projectId: string,
  data: ProjectVideoCreate
): Promise<ProjectVideo> {
  return apiPost<ProjectVideo>(`/api/projects/${projectId}/videos`, data)
}

/**
 * Обновить видео проекта
 */
export async function updateProjectVideo(
  projectId: string,
  videoId: string,
  data: ProjectVideoUpdate
): Promise<ProjectVideo> {
  return apiPut<ProjectVideo>(`/api/projects/${projectId}/videos/${videoId}`, data)
}

/**
 * Удалить видео проекта
 */
export async function deleteProjectVideo(
  projectId: string,
  videoId: string
): Promise<void> {
  return apiDelete<void>(`/api/projects/${projectId}/videos/${videoId}`)
}

/**
 * Обновить порядок проектов
 */
export async function updateProjectsOrder(
  updates: Array<{ id: string; display_order: number }>
): Promise<void> {
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
