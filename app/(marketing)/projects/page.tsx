/**
 * Страница со списком всех проектов в стиле Freshman.tv
 */
import { getProjects } from '@/lib/api/projects'
import { ProjectsPageClient } from './client'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const category = params.category || 'all'
  
  let projects = []
  
  try {
    const allProjects = await getProjects(category === 'all' ? undefined : category)
    projects = allProjects
  } catch (error) {
    console.warn('Ошибка загрузки проектов:', error)
  }

  return <ProjectsPageClient projects={projects} category={category} />
}
