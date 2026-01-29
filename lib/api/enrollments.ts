/**
 * API функции для записей на курсы
 */
import { apiGet, apiPost, apiPut } from './client'
import type { Course } from './courses'

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  progress: number
  enrolled_at: string
  completed_at?: string
}

export interface EnrollmentWithCourse extends Enrollment {
  course: Course
}

/**
 * Получить список записей пользователя (client-side)
 */
export async function getEnrollments(): Promise<Enrollment[]> {
  return apiGet<Enrollment[]>('/api/enrollments')
}

/**
 * Получить список записей пользователя (server-side)
 */
export async function getEnrollmentsServer(cookies?: {
  get: (name: string) => { value: string } | undefined
}): Promise<Enrollment[]> {
  const { apiGet: apiGetServer } = await import('./server')
  return apiGetServer<Enrollment[]>('/api/enrollments', cookies)
}

/**
 * Получить запись на конкретный курс (client-side)
 */
export async function getEnrollmentByCourse(courseId: string): Promise<Enrollment> {
  return apiGet<Enrollment>(`/api/enrollments/${courseId}`)
}

/**
 * Получить запись на конкретный курс (server-side)
 */
export async function getEnrollmentByCourseServer(
  courseId: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<Enrollment> {
  const { apiGet: apiGetServer } = await import('./server')
  return apiGetServer<Enrollment>(`/api/enrollments/${courseId}`, cookies)
}

/**
 * Записаться на курс
 */
export async function createEnrollment(courseId: string): Promise<Enrollment> {
  return apiPost<Enrollment>('/api/enrollments', { course_id: courseId })
}

/**
 * Обновить прогресс обучения
 */
export async function updateEnrollmentProgress(
  enrollmentId: string,
  progress: number
): Promise<Enrollment> {
  return apiPut<Enrollment>(`/api/enrollments/${enrollmentId}/progress`, { progress })
}
