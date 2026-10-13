/**
 * Детальная страница проекта в премиум стиле Freshman.tv
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import {
  getProjectBySlugServer,
  getProjectsServer,
  getProjectVideosServer,
} from '@/features/projects/api'
import { mediaSpecsByVideoIds } from '@/lib/media/manifest'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { buildDescription, buildTitle } from '@/lib/seo/snippet'
import { ProjectDetailClient } from './client'

const SITE_NAME = 'SAVAGE MOVIE'

/** Тип работы для заголовка: «Название — рекламный ролик для клиента | Savage Movie» */
const CATEGORY_LABEL: Record<string, string> = {
  commercial: 'рекламный ролик',
  'music-video': 'музыкальный клип',
  'ai-content': 'AI-видео',
  other: 'видеопроект',
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

  const type = CATEGORY_LABEL[project.category] ?? CATEGORY_LABEL.other
  const client = project.client?.trim()
  const title = buildTitle(`${project.title} — ${type}${client ? ` для ${client}` : ''}`)
  const description = project.description
    ? buildDescription(project.description)
    : `Проект ${project.title} — видеопродакшн Savage Movie.`
  const image = project.thumbnail_url ?? project.cover_image_url ?? project.images?.[0] ?? null

  return {
    title,
    description,
    // Self-canonical обязателен: без него маршрут наследует canonical родителя.
    alternates: {
      canonical: `/projects/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/projects/${slug}`,
      images: image ? [{ url: image, alt: project.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
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

  // Загружаем все проекты и дополнительные видео параллельно
  let allProjects: Awaited<ReturnType<typeof getProjectsServer>> = []
  let projectVideos: Awaited<ReturnType<typeof getProjectVideosServer>> = []
  try {
    ;[allProjects, projectVideos] = await Promise.all([
      getProjectsServer().catch(() => []),
      getProjectVideosServer(project.id).catch(() => []),
    ])
  } catch (error) {
    console.warn('Ошибка загрузки данных:', error)
  }

  const currentIndex = allProjects.findIndex(p => p.id === project.id)
  const nextProject =
    currentIndex >= 0 && currentIndex < allProjects.length - 1
      ? (allProjects[currentIndex + 1] ?? null)
      : (allProjects[0] ?? null)

  const mediaSpecs = mediaSpecsByVideoIds([
    project.mux_playback_id || project.video_url,
    ...projectVideos.map(video => video.mux_playback_id),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Проекты', item: `${baseUrl}/projects` },
      {
        '@type': 'ListItem',
        position: 3,
        name: project.title,
        item: `${baseUrl}/projects/${project.slug}`,
      },
    ],
  }

  return (
    <>
      <JsonLdScripts scripts={[JSON.stringify(breadcrumbJsonLd)]} />
      <ProjectDetailClient
        project={project}
        nextProject={nextProject}
        projectVideos={projectVideos}
        mediaSpecs={mediaSpecs}
        description={
          project.description ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-5 last:mb-0">{children}</p>,
              }}
            >
              {project.description}
            </ReactMarkdown>
          ) : null
        }
      />
    </>
  )
}
