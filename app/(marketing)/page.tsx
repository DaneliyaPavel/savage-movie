/**
 * Главная страница - портировано из v0 reference
 * Fullscreen showreel hero + filmstrip carousel внизу
 */
import type { Metadata } from 'next'
import { ShowreelHero } from '@/components/sections/showreel-hero'
import { SiteFooter } from '@/components/sections/site-footer'
import { getProjectsServer } from '@/features/projects/api'
import { publicEnv } from '@/lib/env'
import { findMediaSpecByVideoId, getMediaSpec, mediaSpecsByVideoIds } from '@/lib/media/manifest'

export const revalidate = 3600 // ISR: revalidate every hour

const metaDescription =
  'Продакшн-студия полного цикла в Санкт-Петербурге и Москве. Рекламные ролики, музыкальные клипы, имиджевые видео, AI-генерация контента. Обсудить проект →'

/*
 * openGraph здесь НЕ переопределяется. В Next.js этот объект заменяется целиком,
 * а не сливается по полям: частичный override с одними title и description
 * выбрасывал image, url, type, locale и siteName из корневого layout — ссылка на
 * главную уходила в мессенджеры без превью. Заголовок и описание у главной и так
 * совпадают с корневыми, поэтому наследуем весь набор.
 */
export const metadata: Metadata = {
  title: 'Видеопродакшн в СПб и Москве — Savage Movie | Реклама, клипы, AI-видео',
  description: metaDescription,
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

  /*
   * Постеры и MP4 первого экрана берутся из манифеста веб-медиа
   * (scripts/media/build-web-video.mjs) по id видео. Если id шоурила в CMS
   * сменили и записи под него нет, hero остаётся на HLS Bunny с кадром Bunny.
   * Пустой id (CMS и env недоступны) — берём шоурил из манифеста как есть.
   *
   * LCP главной — постер hero из HTML. Раньше здесь был preload первой плитки
   * ленты с fetchpriority=high: анимированный webp на 9 МБ забирал канал у
   * первого экрана, поэтому предзагрузки больше нет.
   */
  const showreelMedia = showreelVideoId
    ? findMediaSpecByVideoId(showreelVideoId)
    : getMediaSpec('showreel')
  const projectMedia = mediaSpecsByVideoIds(projects.map(p => p.playbackId))

  return (
    <>
      <main className="relative">
        <ShowreelHero
          showreelPlaybackId={showreelVideoId || showreelMedia?.streamId || ''}
          showreelMedia={showreelMedia}
          projectMedia={projectMedia}
          projects={projects}
        />
        {/*
          Футер после полноэкранного hero — единственная краулимая навигация
          главной. Hero остаётся h-svh и первым экраном; футер открывается
          скроллом. Подробности — в components/sections/site-footer.tsx.
        */}
        <SiteFooter />
      </main>
    </>
  )
}
