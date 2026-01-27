/**
 * Детальная страница проекта в премиум стиле Freshman.tv
 */
import { notFound } from 'next/navigation'
import { getProjectBySlugServer, getProjectsServer } from '@/features/projects/api'
import { ProjectDetailClient } from './client'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let project = null
  
  try {
    project = await getProjectBySlugServer(slug)
  } catch (error) {
    console.warn('Ошибка загрузки проекта:', error)
  }

  if (!project) {
    notFound()
  }

  // Загружаем все проекты для навигации к следующему
  let allProjects: Awaited<ReturnType<typeof getProjectsServer>> = []
  try {
    allProjects = await getProjectsServer()
  } catch (error) {
    console.warn('Ошибка загрузки всех проектов:', error)
  }

  const currentIndex = allProjects.findIndex(p => p.id === project.id)
  const nextProject = currentIndex >= 0 && currentIndex < allProjects.length - 1
    ? (allProjects[currentIndex + 1] ?? null)
    : (allProjects[0] ?? null)

  return <ProjectDetailClient project={project} nextProject={nextProject} />
}
