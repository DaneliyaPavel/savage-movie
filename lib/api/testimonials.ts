/**
 * API функции для отзывов
 */
import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface Testimonial {
  id: string
  name: string
  company: string | null
  project_type: string | null
  text: string | null
  rating: number
  video_url: string | null
  video_playback_id: string | null
  order: number
  created_at: string
  updated_at: string
}

export interface TestimonialCreate {
  name: string
  company?: string | null
  project_type?: string | null
  text?: string | null
  rating?: number
  video_url?: string | null
  video_playback_id?: string | null
  order?: number
}

export interface TestimonialUpdate {
  name?: string
  company?: string | null
  project_type?: string | null
  text?: string | null
  rating?: number
  video_url?: string | null
  video_playback_id?: string | null
  order?: number
}

/**
 * Получить список отзывов
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  return apiGet<Testimonial[]>('/api/testimonials')
}

/**
 * Создать отзыв
 */
export async function createTestimonial(data: TestimonialCreate): Promise<Testimonial> {
  return apiPost<Testimonial>('/api/testimonials', data)
}

/**
 * Обновить отзыв
 */
export async function updateTestimonial(id: string, data: TestimonialUpdate): Promise<Testimonial> {
  return apiPut<Testimonial>(`/api/testimonials/${id}`, data)
}

/**
 * Удалить отзыв
 */
export async function deleteTestimonial(id: string): Promise<void> {
  return apiDelete<void>(`/api/testimonials/${id}`)
}
