/**
 * API для админки (пользователи, аналитика)
 */
import { apiGet } from './client'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: string
  role: string
  created_at: string
  updated_at: string
}

export interface AdminCourseStats {
  course_id: string
  course_title: string
  course_slug: string
  enrollments_count: number
  payments_count: number
  revenue: number
}

export async function getAdminUsers(params?: {
  limit?: number
  offset?: number
}): Promise<AdminUser[]> {
  const search = new URLSearchParams()
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  const q = search.toString()
  return apiGet<AdminUser[]>(`/api/admin/users${q ? `?${q}` : ''}`)
}

export async function getAdminUserEnrollments(userId: string) {
  return apiGet<Array<{
    id: string
    user_id: string
    course_id: string
    progress: number
    enrolled_at: string
    completed_at?: string
    course: { id: string; title: string; slug: string; cover_image: string | null; format: string | null }
  }>>(`/api/admin/users/${userId}/enrollments`)
}

export async function getAdminStatsCourses(): Promise<AdminCourseStats[]> {
  return apiGet<AdminCourseStats[]>('/api/admin/stats/courses')
}
