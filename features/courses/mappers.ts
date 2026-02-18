/**
 * Мапперы для курсов (marketing)
 */
import type { Course as ApiCourse, CardCoverSettings } from './api'

export type MarketingCourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'

const DEFAULT_CARD_COVER: CardCoverSettings = {
  preset: 'meshGrid',
  accent1: '#3b82f6',
  accent2: '#8b5cf6',
  accent3: '#ec4899',
  show_grid: true,
  show_noise: true,
  show_scanlines: false,
  show_orbs: true,
  show_frame_corners: false,
  show_play_icon: false,
  overlay_strength: 'medium',
}

export interface MarketingCourse {
  id: string
  slugRu: string
  slugEn: string
  titleRu: string
  titleEn: string
  descriptionRu: string
  descriptionEn: string
  shortDescriptionRu: string
  shortDescriptionEn: string
  duration: number
  durationText: string | null
  locationText: string | null
  scheduleText: string | null
  tags: string[]
  badgeText: string | null
  ctaText: string | null
  cardCover: CardCoverSettings
  level: MarketingCourseLevel
  students: number
  image: string
  videoPromoUrl: string | null
  icon: string
  color: string
  topicsRu: string[]
  topicsEn: string[]
  forWhomRu: string[]
  forWhomEn: string[]
  format: string | null
  certificate: string | null
}

const COURSE_ICONS = ['✦', '◎', '◈', '◆'] as const
const COURSE_COLORS = [
  'from-violet-500/20 to-fuchsia-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-cyan-500/20 to-blue-500/20',
  'from-emerald-500/20 to-teal-500/20',
] as const

function coerceCourseLevel(value: string | null | undefined): MarketingCourseLevel {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'all')
    return value
  return 'all'
}

export function toMarketingCourse(course: ApiCourse, index: number): MarketingCourse {
  const icon = COURSE_ICONS[index % COURSE_ICONS.length] ?? COURSE_ICONS[0]
  const color = COURSE_COLORS[index % COURSE_COLORS.length] ?? COURSE_COLORS[0]

  const title = course.title || ''
  const description = course.description || ''
  const shortFromApi = course.short_description?.trim()
  const shortDescription = shortFromApi || (description ? description.slice(0, 160) + (description.length > 160 ? '…' : '') : '')

  const cardCover = course.card_cover && typeof course.card_cover === 'object'
    ? { ...DEFAULT_CARD_COVER, ...course.card_cover }
    : DEFAULT_CARD_COVER

  return {
    id: String(course.id),
    slugRu: course.slug || '',
    slugEn: course.slug || '',
    titleRu: title,
    titleEn: title,
    descriptionRu: description,
    descriptionEn: description,
    shortDescriptionRu: shortDescription,
    shortDescriptionEn: shortDescription,
    duration: course.duration ?? 8,
    durationText: course.duration_text ?? null,
    locationText: course.location_text ?? null,
    scheduleText: course.schedule_text ?? null,
    tags: course.tags ?? [],
    badgeText: course.badge_text ?? null,
    ctaText: course.cta_text ?? null,
    cardCover,
    level: coerceCourseLevel(course.level),
    students: 0,
    image: course.cover_image || '/placeholder.svg',
    videoPromoUrl: course.video_promo_url ?? null,
    icon,
    color,
    topicsRu: course.what_you_learn ?? [],
    topicsEn: course.what_you_learn ?? [],
    forWhomRu: course.requirements ?? [],
    forWhomEn: course.requirements ?? [],
    format: course.format ?? null,
    certificate: course.certificate ?? null,
  }
}
