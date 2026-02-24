/**
 * Детальная страница проекта в премиум стиле Freshman.tv
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjectBySlugServer, getProjectsServer } from '@/features/projects/api'
import { ProjectDetailClient } from './client'

const SITE_NAME = 'SAVAGE MOVIE'

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trim() + '…'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let project = null
  try {
    project = await getProjectBySlugServer(slug)
  } catch {
    project = null
  }
  if (!project) return { title: SITE_NAME }

  const title = truncate(`${project.title} | Проекты | ${SITE_NAME}`, 60)
  const description = project.description
    ? truncate(project.description, 160)
    : `Проект ${project.title} — видеопродакшн Savage Movie.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: project.thumbnail_url
        ? [{ url: project.thumbnail_url, width: 1200, height: 630, alt: project.title }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const nextProject =
    currentIndex >= 0 && currentIndex < allProjects.length - 1
      ? (allProjects[currentIndex + 1] ?? null)
      : (allProjects[0] ?? null)

  return <ProjectDetailClient project={project} nextProject={nextProject} />
}
