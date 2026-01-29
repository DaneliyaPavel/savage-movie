/**
 * Мапперы для проектов (marketing)
 */
import type { Project as ApiProject } from './api'
import { normalizeProjectOrientation, type ProjectOrientation } from './utils'

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
  orientation: ProjectOrientation
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
    id: project.id != null ? String(project.id) : '',
    slug: project.slug || (project.id != null ? String(project.id) : ''),
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
    orientation: normalizeProjectOrientation(project.orientation),
    isAI: project.category === 'ai-content',
  }
}
