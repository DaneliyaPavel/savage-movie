/**
 * Главная страница - портировано из v0 reference
 * Fullscreen showreel hero + filmstrip carousel внизу
 */
import { ShowreelHero } from '@/components/sections/showreel-hero'
import { getProjectsServer } from '@/features/projects/api'
import { publicEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

// Mux Playback ID для showreel - из env или fallback
const SHOWREEL_PLAYBACK_ID =
  publicEnv.NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID || 'Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM'

export default async function HomePage() {
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
        playbackId: p.mux_playback_id || SHOWREEL_PLAYBACK_ID,
        slug: p.slug,
      }
    })

    // Отладочная информация в development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Загружено ${featuredProjects.length} featured проектов`)
      console.log(`✅ Преобразовано ${projects.length} проектов для carousel`)
      if (projects.length > 0) {
        console.log(
          'Проекты для carousel:',
          projects.map(p => ({ id: p.id, title: p.titleRu, thumbnail: p.thumbnail }))
        )
      }
    }
  } catch (error) {
    console.error(
      '❌ Ошибка загрузки featured проектов:',
      error instanceof Error ? error.message : String(error)
    )
    if (process.env.NODE_ENV === 'development') {
      console.error('Детали ошибки:', error)
    }
  }

  // Отладочная информация в development
  if (process.env.NODE_ENV === 'development' && projects.length === 0) {
    console.warn('⚠️ Нет featured проектов для отображения в carousel. Проверьте:')
    console.warn('1. Есть ли проекты с is_featured = true в базе данных')
    console.warn('2. Заполнены ли thumbnail_url или images для проектов')
  }

  return (
    <main className="relative">
      <ShowreelHero showreelPlaybackId={SHOWREEL_PLAYBACK_ID} projects={projects} />
    </main>
  )
}
