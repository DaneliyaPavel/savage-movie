/**
 * Детальная страница проекта в премиум стиле Freshman.tv
 */
import { notFound } from 'next/navigation'
import { getProjectBySlug, getProjects } from '@/lib/api/projects'
import { ProjectDetailClient } from './client'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let project = null
  
  try {
    project = await getProjectBySlug(slug)
  } catch (error) {
    console.warn('Ошибка загрузки проекта:', error)
  }

  if (!project) {
    notFound()
  }

  // Загружаем все проекты для навигации к следующему
  let allProjects = []
  try {
    allProjects = await getProjects()
  } catch (error) {
    console.warn('Ошибка загрузки всех проектов:', error)
  }

  const currentIndex = allProjects.findIndex(p => p.id === project.id)
  const nextProject = currentIndex >= 0 && currentIndex < allProjects.length - 1
    ? allProjects[currentIndex + 1]
    : allProjects[0] || null

  return <ProjectDetailClient project={project} nextProject={nextProject} />
}
