/**
 * Доказательства направлений: связывает конфигурацию направлений с реальным
 * портфолио.
 *
 * Правило одно: на странице не появляется работа, которой нет в опубликованных
 * проектах. Слаг из конфигурации, не найденный в портфолио, молча выпадает —
 * так переименованный или снятый с публикации кейс превращается в отсутствующую
 * карточку, а не в битую ссылку на /projects/<slug>. Направление без единой
 * найденной работы остаётся в монтаже: заголовок, копия и CTA от этого не
 * перестают быть правдой, исчезает только блок с кейсами.
 */
import type { Project } from '@/features/projects/api'
import { getThumbnailUrl } from '@/lib/integrations/bunny/client'
import { normalizePosterUrl } from '@/lib/commercial-landing/poster-url'
import { SERVICE_DIRECTIONS, type ServiceDirection } from './directions'

export interface DirectionWork {
  slug: string
  /** Название работы: «Шесть утра» */
  title: string
  /** Бренд: «WELLERY». Пустым не бывает — фолбэк на название */
  client: string
  year: string | null
  playbackId: string | null
  posterUrl: string | null
}

export interface ResolvedDirection extends ServiceDirection {
  works: DirectionWork[]
}

/** Постер работы: свой кадр из CMS, иначе автопревью Bunny, иначе ничего */
function posterFor(project: Project): string | null {
  if (project.thumbnail_url) return normalizePosterUrl(project.thumbnail_url)
  if (project.cover_image_url) return normalizePosterUrl(project.cover_image_url)
  if (project.images?.[0]) return normalizePosterUrl(project.images[0])
  if (project.mux_playback_id) return getThumbnailUrl(project.mux_playback_id)
  return null
}

function toWork(project: Project): DirectionWork {
  return {
    slug: project.slug,
    title: project.title_ru || project.title,
    client: project.client || project.title_ru || project.title,
    year: project.year ? String(project.year) : null,
    playbackId: project.mux_playback_id || null,
    posterUrl: posterFor(project),
  }
}

/**
 * Собирает направления вместе с их работами.
 *
 * Вызывается на сервере: кадры и подписи должны быть в HTML первого ответа,
 * иначе поиск увидит раздел услуг без единого доказательства.
 *
 * Результат — это ровно то, что уезжает в браузер, поэтому путь
 * неопубликованного направления здесь обнуляется. Ссылки на него всё равно
 * не появляется (её ставит только directionHref для опубликованных), но и
 * самой строки «/fashion-video» в отданном документе быть незачем: карта
 * будущих маршрутов — внутренний план, а не анонс несуществующих страниц.
 */
export function resolveDirections(projects: Project[]): ResolvedDirection[] {
  const bySlug = new Map(projects.map(project => [project.slug, project]))

  return SERVICE_DIRECTIONS.map(direction => ({
    ...direction,
    route: direction.route.published ? direction.route : { path: '', published: false },
    works: direction.proofSlugs
      .map(slug => bySlug.get(slug))
      .filter((project): project is Project => Boolean(project))
      .map(toWork),
  }))
}

/**
 * Кадры для монтажа первого экрана — по одному на направление, в порядке
 * направлений. Пустые направления пропускаются, поэтому монтаж не моргает
 * чёрным на месте отсутствующей работы.
 *
 * Работы дедуплицируются: одна и та же съёмка законно доказывает несколько
 * направлений (WELLERY — и реклама, и регулярный контент), но дважды в одном
 * монтаже тот же план читается как сбой склейки.
 */
export function heroMontage(directions: ResolvedDirection[]): DirectionWork[] {
  const seen = new Set<string>()

  return directions.reduce<DirectionWork[]>((frames, direction) => {
    const work = direction.works[0]
    if (!work?.posterUrl || seen.has(work.slug)) return frames
    seen.add(work.slug)
    frames.push(work)
    return frames
  }, [])
}
