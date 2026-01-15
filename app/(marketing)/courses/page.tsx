/**
 * Страница со списком всех курсов в стиле Freshman.tv
 */
import { getCourses } from '@/lib/api/courses'
import { CoursesPageClient } from './client'

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const category = params.category || 'all'
  
  let courses = []
  
  try {
    courses = await getCourses(category === 'all' ? undefined : category)
  } catch (error) {
    console.warn('Ошибка загрузки курсов:', error)
  }

  return <CoursesPageClient courses={courses} category={category} />
}
