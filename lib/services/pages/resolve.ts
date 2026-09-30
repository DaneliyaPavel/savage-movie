/**
 * Работы страницы направления вместе с их кадрами.
 *
 * Хаб /services берёт у работы один выбранный план. Странице направления
 * нужен весь материал: fashion набирает разворот из разных кадров одной
 * съёмки, beauty показывает макро за макро. Поэтому здесь отдаётся галерея,
 * а не один постер.
 *
 * Правило то же, что в proof.ts: слаг, которого нет среди опубликованных
 * проектов, молча выпадает. Выдуманный или снятый с публикации кейс не должен
 * превращаться в битую ссылку на /projects/<slug>.
 */
import type { Project } from '@/features/projects/api'
import { normalizePosterUrl } from '@/lib/commercial-landing/poster-url'
import { getThumbnailUrl } from '@/lib/integrations/bunny/client'
import { getServiceDirection, type ServiceDirectionId } from '../directions'
import type { DirectionWork } from '../proof'

export interface DirectionPageWork extends DirectionWork {
  /** Все кадры галереи, уже прошедшие нормализацию; пусто — остаётся posterUrl */
  stills: string[]
  /** Краткое описание из портфолио, если оно есть */
  description: string | null
}

function stillsOf(project: Project): string[] {
  const gallery = (project.images ?? []).filter(Boolean).map(normalizePosterUrl)
  if (gallery.length > 0) return gallery
  const fallback = project.thumbnail_url || project.cover_image_url
  return fallback ? [normalizePosterUrl(fallback)] : []
}

/** Первое предложение описания: одна строка под названием работы в титрах */
export function firstSentence(text: string | null, limit = 170): string | null {
  if (!text) return null
  const clean = text.replace(/\s+/g, ' ').trim()
  const end = clean.search(/[.!?…](\s|$)/)
  const sentence = end > 0 ? clean.slice(0, end + 1) : clean
  if (sentence.length <= limit) return sentence
  return `${sentence.slice(0, limit).replace(/\s+\S*$/, '')}…`
}

export function toPageWork(project: Project, still = 0): DirectionPageWork {
  const stills = stillsOf(project)
  const playbackId = project.mux_playback_id || null
  return {
    slug: project.slug,
    title: project.title_ru || project.title,
    client: project.client || project.title_ru || project.title,
    year: project.year ? String(project.year) : null,
    playbackId,
    posterUrl: stills[still] ?? stills[0] ?? (playbackId ? getThumbnailUrl(playbackId) : null),
    stills,
    description: project.description_ru || project.description || null,
  }
}

/** Работы направления в порядке proofSlugs; недостающие слаги пропускаются */
export function resolvePageWorks(
  id: ServiceDirectionId,
  projects: Project[],
  stillBySlug: Partial<Record<string, number>> = {}
): DirectionPageWork[] {
  const direction = getServiceDirection(id)
  if (!direction) return []
  const bySlug = new Map(projects.map(project => [project.slug, project]))

  return direction.proofSlugs
    .map(slug => bySlug.get(slug))
    .filter((project): project is Project => Boolean(project))
    .map(project => toPageWork(project, stillBySlug[project.slug] ?? 0))
}

/**
 * Кадры для визуальной сцены: плоский список «кадр + откуда он», собранный из
 * галерей работ. Порядок — по кругу между работами, чтобы соседние кадры были
 * из разных съёмок, а не пять подряд одной.
 */
export interface SceneFrame {
  key: string
  src: string
  slug: string
  client: string
  title: string
}

export function interleaveFrames(works: DirectionPageWork[], limit = 12): SceneFrame[] {
  const frames: SceneFrame[] = []
  const depth = Math.max(0, ...works.map(work => work.stills.length))
  for (let layer = 0; layer < depth && frames.length < limit; layer += 1) {
    for (const work of works) {
      const src = work.stills[layer]
      if (!src || frames.length >= limit) continue
      frames.push({
        key: `${work.slug}-${layer}`,
        src,
        slug: work.slug,
        client: work.client,
        title: work.title,
      })
    }
  }
  return frames
}
