/**
 * API для материалов курса
 */
import { apiGet } from './client'

export interface CourseMaterial {
  id: string
  course_id: string
  lesson_id: string | null
  title: string
  material_type: string
  file_url: string | null
  external_url: string | null
  display_order: number | null
  created_at: string
}

export async function getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  return apiGet<CourseMaterial[]>(`/api/course-materials?course_id=${courseId}`)
}

export async function getCourseMaterialsServer(
  courseId: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<CourseMaterial[]> {
  const { apiGet: apiGetServer } = await import('./server')
  return apiGetServer<CourseMaterial[]>(
    `/api/course-materials?course_id=${courseId}`,
    cookies
  )
}
