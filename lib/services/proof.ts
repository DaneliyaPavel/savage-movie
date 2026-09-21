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
import { CLOSING_FRAME, HERO_ORDER, SERVICE_FRAMES } from './frames'

export interface DirectionWork {
  slug: string
  /** Название работы: «Шесть утра» */
  title: string
  /** Бренд: «WELLERY». Пустым не бывает — фолбэк на название */
  client: string
  year: string | null
  playbackId: string | null
  /** Кадр сцены: выбранный раскадровкой план, а не первый попавшийся */
  posterUrl: string | null
}

export interface ResolvedDirection extends ServiceDirection {
  works: DirectionWork[]
}

/**
 * Кадр работы.
 *
 * still — номер плана из раскадровки. Раньше здесь безусловно брался
 * images[0]: не выбранный кадр, а просто первый элемент массива, и именно
 * поэтому четыре сцены из семи держались на одном мягком плане. Если
 * названного плана в галерее нет (кадр сняли с публикации), спускаемся к
 * первому — сцена теряет выбор, но не теряет изображение.
 */
function posterFor(project: Project, still = 0): string | null {
  const gallery = project.images ?? []
  const chosen = gallery[still] ?? gallery[0]
  if (chosen) return normalizePosterUrl(chosen)
  if (project.thumbnail_url) return normalizePosterUrl(project.thumbnail_url)
  if (project.cover_image_url) return normalizePosterUrl(project.cover_image_url)
  if (project.mux_playback_id) return getThumbnailUrl(project.mux_playback_id)
  return null
}

function toWork(project: Project, still = 0): DirectionWork {
  return {
    slug: project.slug,
    title: project.title_ru || project.title,
    client: project.client || project.title_ru || project.title,
    year: project.year ? String(project.year) : null,
    playbackId: project.mux_playback_id || null,
    posterUrl: posterFor(project, still),
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

  return SERVICE_DIRECTIONS.map(direction => {
    const frames = SERVICE_FRAMES[direction.id]

    /*
     * Порядок доказательств задаёт directions.ts, но открывает территорию тот
     * кадр, который назвала раскадровка: сцена берёт works[0], и туда же
     * смотрит монтаж первого экрана. Состав направления при этом не меняется —
     * меняется только то, какая из работ выходит первой.
     */
    const slugs = frames.lead
      ? [frames.lead, ...direction.proofSlugs.filter(slug => slug !== frames.lead)]
      : direction.proofSlugs

    return {
      ...direction,
      route: direction.route.published ? direction.route : { path: '', published: false },
      works: slugs
        .map(slug => bySlug.get(slug))
        .filter((project): project is Project => Boolean(project))
        .map(project => toWork(project, frames.still[project.slug] ?? 0)),
    }
  })
}

/**
 * Кадр, которым закрывается страница.
 *
 * Берётся из раскадровки, а не из монтажа: выходу нужен не первый и не
 * последний увиденный план, а тот единственный, в котором есть тишина.
 * Если его нет в портфолио, закрываем первым планом монтажа — страница
 * всё равно заканчивается кадром, просто не выбранным.
 */
export function closingFrame(projects: Project[], montage: DirectionWork[]): DirectionWork | null {
  const project = projects.find(item => item.slug === CLOSING_FRAME.slug)
  if (!project) return montage[0] ?? null
  return toWork(project, CLOSING_FRAME.still)
}

/**
 * Кадры для монтажа первого экрана — по одному на направление, в порядке
 * направлений. Пустые направления пропускаются, поэтому монтаж не моргает
 * чёрным на месте отсутствующей работы.
 *
 * Работы дедуплицируются: одна и та же съёмка законно доказывает несколько
 * направлений (WELLERY — и реклама, и регулярный контент), но дважды в одном
 * монтаже тот же план читается как сбой склейки.
 *
 * Порядок и состав задаёт раскадровка (HERO_ORDER), а не порядок территорий:
 * какой кадр открывает фильм — решение режиссёрское, и принимается оно в
 * одном месте вместе с остальными кадрами.
 */
export function heroMontage(directions: ResolvedDirection[]): DirectionWork[] {
  const seen = new Set<string>()
  const byId = new Map(directions.map(direction => [direction.id, direction]))
  const ordered = HERO_ORDER.map(id => byId.get(id)).filter(
    (direction): direction is ResolvedDirection => Boolean(direction)
  )

  return ordered.reduce<DirectionWork[]>((frames, direction) => {
    const work = direction.works[0]
    if (!work?.posterUrl || seen.has(work.slug)) return frames
    seen.add(work.slug)
    frames.push(work)
    return frames
  }, [])
}
