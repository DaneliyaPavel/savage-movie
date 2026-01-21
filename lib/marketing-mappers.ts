import type { Course as ApiCourse } from '@/lib/api/courses'
import type { Project as ApiProject } from '@/lib/api/projects'

export type MarketingCourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'

export interface MarketingCourse {
  id: string
  slugRu: string
  slugEn: string
  titleRu: string
  titleEn: string
  descriptionRu: string
  descriptionEn: string
  duration: number
  level: MarketingCourseLevel
  students: number
  image: string
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
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'all') return value
  return 'all'
}

export function toMarketingCourse(course: ApiCourse, index: number): MarketingCourse {
  const icon = COURSE_ICONS[index % COURSE_ICONS.length] ?? COURSE_ICONS[0]
  const color = COURSE_COLORS[index % COURSE_COLORS.length] ?? COURSE_COLORS[0]

  // Контент в проекте считается одноязычным (i18n используется для UI-лейблов),
  // поэтому ru/en поля заполняем одинаковым значением.
  const title = course.title || ''
  const description = course.description || ''

  return {
    id: String(course.id),
    slugRu: course.slug || '',
    slugEn: course.slug || '',
    titleRu: title,
    titleEn: title,
    descriptionRu: description,
    descriptionEn: description,
    duration: course.duration ?? 8,
    level: coerceCourseLevel(course.level),
    students: 0,
    image: course.cover_image || '/placeholder.svg',
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

export interface MarketingProject {
  id: string
  slug: string
  titleRu: string
  titleEn: string
  clientRu: string
  clientEn: string
  category: string
  categoryRu: string
  year: string
  thumbnails: string[]
  videoUrl: string
  descriptionRu: string
  descriptionEn: string
  isAI?: boolean
}

function categoryToRu(category: string | null | undefined): string {
  switch (category) {
    case 'ai-content':
      return 'AI'
    case 'music-video':
      return 'Клип'
    case 'commercial':
      return 'Коммерция'
    default:
      return 'Другое'
  }
}

export function toMarketingProject(project: ApiProject): MarketingProject {
  const title = project.title || ''
  const description = project.description || ''
  const client = project.client || ''

  const thumbnails =
    project.images && Array.isArray(project.images) && project.images.length > 0
      ? project.images.slice(0, 5)
      : project.thumbnail_url
        ? [project.thumbnail_url]
        : project.cover_image_url
          ? [project.cover_image_url]
          : ['/placeholder.svg']

  return {
    id: String(project.id),
    slug: project.slug || String(project.id),
    titleRu: title,
    titleEn: title,
    clientRu: client || 'Клиент',
    clientEn: client || 'Client',
    category: project.category || 'other',
    categoryRu: categoryToRu(project.category),
    year: project.year ? String(project.year) : String(new Date().getFullYear()),
    thumbnails,
    videoUrl: project.video_url && project.video_url.trim() !== '' ? project.video_url : '',
    descriptionRu: description || 'Описание проекта',
    descriptionEn: description || 'Project description',
    isAI: project.category === 'ai-content',
  }
}
