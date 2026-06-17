/**
 * Главная страница - портировано из v0 reference
 * Fullscreen showreel hero + filmstrip carousel внизу
 */
import type { Metadata } from 'next'
import { ShowreelHero } from '@/components/sections/showreel-hero'
import { getProjectsServer } from '@/features/projects/api'
import { publicEnv } from '@/lib/env'

export const revalidate = 3600 // ISR: revalidate every hour

const metaDescription =
  'Продакшн-студия полного цикла в Санкт-Петербурге и Москве. Рекламные ролики, музыкальные клипы, имиджевые видео, AI-генерация контента. Обсудить проект →'

export const metadata: Metadata = {
  title: 'Видеопродакшн в СПб и Москве — Savage Movie | Реклама, клипы, AI-видео',
  description: metaDescription,
  openGraph: {
    title: 'Видеопродакшн в СПб и Москве — Savage Movie | Реклама, клипы, AI-видео',
    description: metaDescription,
  },
  alternates: {
    canonical: '/',
  },
}

// Fallback Bunny Video ID из env — используется, если в админке не задан hero_video_playback_id
const SHOWREEL_VIDEO_ID_FALLBACK = publicEnv.NEXT_PUBLIC_SHOWREEL_VIDEO_ID || ''

export default async function HomePage() {
  // Showreel video ID: приоритет настройке из админки, фолбэк на env
  let showreelVideoId = SHOWREEL_VIDEO_ID_FALLBACK
  try {
    const { apiGet: apiGetServer } = await import('@/lib/api/server')
    const response = await apiGetServer<{ settings: Record<string, unknown> }>('/api/settings')
    const fromAdmin = response.settings?.hero_video_playback_id
    if (typeof fromAdmin === 'string' && fromAdmin.trim() !== '') {
      showreelVideoId = fromAdmin.trim()
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        'Ошибка загрузки настроек showreel:',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  // Загружаем проекты для filmstrip carousel
  let projects: Array<{
    id: string
    titleRu: string
    titleEn: string
    directorRu: string
    directorEn: string
    client: string | null
    thumbnail: string
    playbackId: string
    carousel_gif_url?: string | null
    slug?: string
  }> = []

  try {
    // Получаем только featured проекты для главной страницы (server-side)
    const featuredProjects = await getProjectsServer(undefined, true)
    // Преобразуем проекты в формат для ShowreelHero
    projects = featuredProjects.map(p => {
      // Определяем thumbnail: сначала thumbnail_url, потом cover_image_url, потом первое изображение из массива
      let thumbnail = '/placeholder.svg'
      if (p.thumbnail_url) {
        thumbnail = p.thumbnail_url
      } else if (p.cover_image_url) {
        thumbnail = p.cover_image_url
      } else if (p.images && Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
        thumbnail = p.images[0]
      }

      return {
        id: p.id.toString(),
        titleRu: p.title_ru || p.title || '',
        titleEn: p.title_en || p.title || '',
        directorRu: '', // TODO: добавить связь с директорами если нужно
        directorEn: '',
        client: p.client || null,
        thumbnail: thumbnail,
        playbackId: p.mux_playback_id || showreelVideoId,
        carousel_gif_url: p.carousel_gif_url || null,
        slug: p.slug,
      }
    })

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '❌ Ошибка загрузки featured проектов:',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  // Preload the first carousel image (LCP element) for faster loading
  const firstCarouselUrl = projects[0]?.carousel_gif_url || null

  return (
    <>
      {firstCarouselUrl && (
        <link rel="preload" as="image" href={firstCarouselUrl} fetchPriority="high" />
      )}
      <main className="relative">
        <ShowreelHero showreelPlaybackId={showreelVideoId} projects={projects} />
      </main>
    </>
  )
}
