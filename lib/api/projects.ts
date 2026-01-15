/**
 * API функции для проектов
 */
import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  client: string | null
  category: 'commercial' | 'ai-content' | 'music-video' | 'other'
  video_url: string | null
  images: string[] | null
  duration: number | null
  role: string | null
  tools: string[] | null
  behind_scenes: string[] | null
  created_at: string
  updated_at: string
}

/**
 * Получить список проектов
 */
export async function getProjects(category?: string): Promise<Project[]> {
  const params = category && category !== 'all' ? `?category=${category}` : ''
  return apiGet<Project[]>(`/api/projects${params}`)
}

/**
 * Получить проект по slug
 */
export async function getProjectBySlug(slug: string): Promise<Project> {
  return apiGet<Project>(`/api/projects/${slug}`)
}

export interface ProjectCreate {
  title: string
  slug: string
  description?: string | null
  client?: string | null
  category: 'commercial' | 'ai-content' | 'music-video' | 'other'
  video_url?: string | null
  images?: string[] | null
  duration?: number | null
  role?: string | null
  tools?: string[] | null
  behind_scenes?: string[] | null
}

export interface ProjectUpdate {
  title?: string
  slug?: string
  description?: string | null
  client?: string | null
  category?: 'commercial' | 'ai-content' | 'music-video' | 'other'
  video_url?: string | null
  images?: string[] | null
  duration?: number | null
  role?: string | null
  tools?: string[] | null
  behind_scenes?: string[] | null
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
