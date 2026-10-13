import type { Metadata } from 'next'
import { getProjectsServer } from '@/features/projects/api'
import { toMarketingProject } from '@/features/projects/mappers'
import { mediaSpecsByVideoIds } from '@/lib/media/manifest'
import ProjectsPageClient from './projects-client'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Портфолио — рекламные ролики, клипы, AI-видео | Savage Movie СПб',
  description:
    'Видеопроекты Savage Movie: рекламные ролики, имиджевое видео, музыкальные клипы, AI-контент. Смотреть кейсы →',
  alternates: {
    canonical: '/projects',
  },
  /*
   * openGraph задаётся целиком: Next заменяет объект, а не сливает с корневым layout.
   * Без него превью ссылки на /projects уходило в мессенджеры с заголовком главной.
   */
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'SAVAGE MOVIE',
    url: '/projects',
    title: 'Портфолио — рекламные ролики, клипы, AI-видео | Savage Movie СПб',
    description:
      'Видеопроекты Savage Movie: рекламные ролики, имиджевое видео, музыкальные клипы, AI-контент. Смотреть кейсы →',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Savage Movie' }],
  },
}

export default async function ProjectsPage() {
  const projects = await loadProjects()
  const mediaSpecs = mediaSpecsByVideoIds(projects.map(project => project.videoUrl))
  return <ProjectsPageClient initialProjects={projects} mediaSpecs={mediaSpecs} />
}

async function loadProjects() {
  try {
    const apiProjects = await getProjectsServer()
    return apiProjects.map(toMarketingProject)
  } catch (error) {
    console.error('Ошибка загрузки проектов (server)', error)
    return []
  }
}
