/**
 * API функции для курсов
 */
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client'

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  video_url: string | null
  duration: number | null
  order: number
  created_at: string
}

export interface CourseModule {
  id: string
  course_id: string
  title: string
  description: string | null
  order: number
  lessons: Lesson[]
  created_at: string
}

export type CardCoverPreset = 'mesh' | 'meshGrid' | 'meshGridScanlines' | 'minimalTech'
export type OverlayStrength = 'low' | 'medium' | 'high'

export type CardCoverMediaType = 'image' | 'video'

export interface CardCoverSettings {
  preset?: CardCoverPreset | null
  accent1?: string | null
  accent2?: string | null
  accent3?: string | null
  show_grid?: boolean | null
  show_noise?: boolean | null
  show_scanlines?: boolean | null
  show_orbs?: boolean | null
  show_frame_corners?: boolean | null
  show_play_icon?: boolean | null
  overlay_strength?: OverlayStrength | null
  media_type?: CardCoverMediaType | null
  /** Чистая обложка без оформления (mesh, сетка, шум и т.д.) — только картинка или видео */
  no_overlay?: boolean | null
  /** Цвет мигающего маркера у бейджа (HEX). Если не задан — по формату курса (онлайн/офлайн и т.д.) */
  badge_dot_color?: string | null
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  duration: number | null
  cover_image: string | null
  video_promo_url: string | null
  instructor_id: string | null
  category: 'ai' | 'shooting' | 'editing' | 'production'
  requirements: string[] | null
  what_you_learn: string[] | null
  modules: CourseModule[] | null
  level: string | null
  certificate: string | null
  format: string | null
  display_order: number | null
  short_description?: string | null
  duration_text?: string | null
  location_text?: string | null
  schedule_text?: string | null
  tags?: string[] | null
  badge_text?: string | null
  cta_text?: string | null
  card_cover?: CardCoverSettings | null
  created_at: string
  updated_at: string
}

/**
 * Получить список курсов
 */
export async function getCourses(category?: string): Promise<Course[]> {
  const params = category && category !== 'all' ? `?category=${category}` : ''
  return apiGet<Course[]>(`/api/courses${params}`)
}

/**
 * Получить курс по ID (client-side)
 */
export async function getCourseById(id: string): Promise<Course> {
  return apiGet<Course>(`/api/courses/${id}`)
}

/**
 * Получить курс по slug (client-side)
 */
export async function getCourseBySlug(slug: string): Promise<Course> {
  return apiGet<Course>(`/api/courses/${slug}`)
}

/**
 * Получить курс по ID (server-side)
 */
export async function getCourseByIdServer(
  id: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Course> {
  const { apiGet: apiGetServer } = await import('@/lib/api/server')
  return apiGetServer<Course>(`/api/courses/${id}`, cookies)
}

/**
 * Получить курс по slug (server-side)
 */
export async function getCourseBySlugServer(
  slug: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Course> {
  const { apiGet: apiGetServer } = await import('@/lib/api/server')
  return apiGetServer<Course>(`/api/courses/${slug}`, cookies)
}

export interface LessonCreate {
  title: string
  video_url?: string | null
  duration?: number | null
  order: number
}

export interface CourseModuleCreate {
  title: string
  order: number
  lessons?: LessonCreate[]
}

export interface CourseCreate {
  title: string
  slug: string
  description?: string | null
  price: number
  duration?: number | null
  cover_image?: string | null
  video_promo_url?: string | null
  category: 'ai' | 'shooting' | 'editing' | 'production'
  requirements?: string[] | null
  what_you_learn?: string[] | null
  modules?: CourseModuleCreate[]
  level?: string | null
  certificate?: string | null
  format?: string | null
  display_order?: number | null
  short_description?: string | null
  duration_text?: string | null
  location_text?: string | null
  schedule_text?: string | null
  tags?: string[] | null
  badge_text?: string | null
  cta_text?: string | null
  card_cover?: CardCoverSettings | null
}

export interface CourseUpdate {
  title?: string
  slug?: string
  description?: string | null
  price?: number
  duration?: number | null
  cover_image?: string | null
  video_promo_url?: string | null
  category?: 'ai' | 'shooting' | 'editing' | 'production'
  requirements?: string[] | null
  what_you_learn?: string[] | null
  level?: string | null
  certificate?: string | null
  format?: string | null
  display_order?: number | null
  short_description?: string | null
  duration_text?: string | null
  location_text?: string | null
  schedule_text?: string | null
  tags?: string[] | null
  badge_text?: string | null
  cta_text?: string | null
  card_cover?: CardCoverSettings | null
  modules?: CourseModuleCreate[]
}

/**
 * Создать курс
 */
export async function createCourse(data: CourseCreate): Promise<Course> {
  return apiPost<Course>('/api/courses', data)
}

/**
 * Обновить курс
 */
export async function updateCourse(id: string, data: CourseUpdate): Promise<Course> {
  return apiPut<Course>(`/api/courses/${id}`, data)
}

/**
 * Удалить курс
 */
export async function deleteCourse(id: string): Promise<void> {
  return apiDelete<void>(`/api/courses/${id}`)
}

/**
 * Обновить порядок курсов
 */
export async function updateCoursesOrder(
  updates: Array<{ id: string; display_order: number }>
): Promise<void> {
  return apiPost<void>('/api/courses/reorder', { updates })
}
