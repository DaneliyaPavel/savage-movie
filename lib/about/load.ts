/**
 * Серверная загрузка данных страницы /about.
 *
 * Страница не зависит от бэкенда целиком: без проектов пропадают цифры и
 * «Работы», без настроек — «Люди». Тексты, направления, этапы и FAQ остаются.
 * Отказ загрузки логируется и не роняет рендер — в отличие от /clients, эта
 * страница не состоит из портфолио.
 */
import { getProjectsServer, type Project } from '@/features/projects/api'
import type { SettingsResponse } from '@/lib/api/settings'
import { ROLL_PRIORITY } from '@/features/clients/content'
import { buildClientRoll, categoryLabelRu, pickStill } from '@/features/clients/mappers'
import { SERVICE_DIRECTIONS } from '@/lib/services/directions'
import { logger } from '@/lib/utils/logger'
import { ABOUT_WORK_SLUGS } from './content'
import { normalizeTeam, type TeamMember } from './team'

export interface AboutWork {
  slug: string
  client: string
  title: string
  year: number | null
  category: string
  still: string
  vertical: boolean
}

export interface AboutNumbers {
  brands: number
  projects: number
  /** Первый и последний год по опубликованным проектам; null, если годов нет */
  years: [number, number] | null
  directions: number
}

export interface AboutData {
  numbers: AboutNumbers | null
  /** Бренды в порядке ролла /clients: для бегущей строки */
  brands: string[]
  works: AboutWork[]
  team: TeamMember[]
}

export function yearSpan(projects: Pick<Project, 'year'>[]): [number, number] | null {
  const years = projects
    .map(project => project.year)
    .filter((year): year is number => typeof year === 'number' && year > 1990)
  if (years.length === 0) return null
  return [Math.min(...years), Math.max(...years)]
}

export function toAboutWorks(projects: Project[]): AboutWork[] {
  const bySlug = new Map(projects.map(project => [project.slug, project]))
  return ABOUT_WORK_SLUGS.flatMap(slug => {
    const project = bySlug.get(slug)
    const still = project ? pickStill(project) : null
    if (!project || !still) return []
    return [
      {
        slug: project.slug,
        client: project.client?.trim() || project.title_ru || project.title,
        title: project.title_ru || project.title,
        year: project.year ?? null,
        category: categoryLabelRu(project.category),
        still,
        vertical: project.orientation === 'vertical',
      },
    ]
  })
}

async function loadTeam(): Promise<TeamMember[]> {
  try {
    const { apiGet } = await import('@/lib/api/server')
    const response = await apiGet<SettingsResponse>('/api/settings')
    return normalizeTeam(response.settings.about_team)
  } catch (error) {
    logger.error('Не удалось загрузить команду для /about', error)
    return []
  }
}

export async function loadAboutData(): Promise<AboutData> {
  const [projects, team] = await Promise.all([
    getProjectsServer().catch((error: unknown) => {
      logger.error('Не удалось загрузить проекты для /about', error)
      return [] as Project[]
    }),
    loadTeam(),
  ])

  const roll = buildClientRoll(projects, [], ROLL_PRIORITY)
  const hasPortfolio = roll.brandCount > 0 && roll.projectCount > 0

  return {
    numbers: hasPortfolio
      ? {
          brands: roll.brandCount,
          projects: roll.projectCount,
          years: yearSpan(projects),
          directions: SERVICE_DIRECTIONS.filter(direction => direction.route.published).length,
        }
      : null,
    brands: roll.entries.map(entry => entry.name),
    works: toAboutWorks(projects),
    team,
  }
}
