/**
 * Реестр страниц направлений: по идентификатору — содержимое и маршрут.
 * Commercial здесь нет: у него своя страница /reklamny-rolik со своим CMS.
 */
import { getServiceDirection, type ServiceDirectionId } from '../directions'
import { AI_PAGE } from './content/ai'
import { BEAUTY_PAGE } from './content/beauty'
import { CONTENT_PAGE } from './content/content-production'
import { CORPORATE_PAGE } from './content/corporate'
import { FASHION_PAGE } from './content/fashion'
import { MUSIC_PAGE } from './content/music'
import type { DirectionPageBase } from './types'

export const DIRECTION_PAGES: Partial<Record<ServiceDirectionId, DirectionPageBase>> = {
  fashion: FASHION_PAGE,
  beauty: BEAUTY_PAGE,
  'content-production': CONTENT_PAGE,
  corporate: CORPORATE_PAGE,
  ai: AI_PAGE,
  music: MUSIC_PAGE,
}

/** Внутренние статьи блога, уместные на странице направления (слаги существуют на live) */
export const DIRECTION_READING: Partial<
  Record<ServiceDirectionId, { href: string; label: string }[]>
> = {
  corporate: [
    { href: '/blog/korporativnoe-video', label: 'Как устроено корпоративное видео' },
    { href: '/blog/process-videoproduction', label: 'Как проходит видеопродакшн' },
  ],
  ai: [
    { href: '/blog/ai-vs-tradicionnaya-syomka', label: 'AI или традиционная съёмка' },
    { href: '/blog/ai-generaciya-video-2026', label: 'AI-генерация видео' },
  ],
  music: [{ href: '/blog/kak-snyat-muzykalnyj-klip', label: 'Как снять музыкальный клип' }],
  'content-production': [
    { href: '/blog/videokontent-dlya-socsetej-2026', label: 'Видеоконтент для соцсетей' },
  ],
}

export function directionPath(id: ServiceDirectionId): string {
  const direction = getServiceDirection(id)
  if (!direction) throw new Error(`Неизвестное направление: ${id}`)
  return direction.route.path
}
