/**
 * Client roll: сборка списка брендов для /clients.
 *
 * Источник правды — опубликованные проекты. Таблица `clients` в CMS изначально
 * писалась под режиссёров (slug, bio, role, portfolio_videos) и на проде пустая,
 * поэтому строить страницу только на ней значило бы показывать пустой экран при
 * 19 живых проектах. Поле `projects.client` заполняется на каждом проекте и
 * редактируется в той же админке — это и есть реальный список тех, с кем работали.
 *
 * CMS-запись клиента при этом не игнорируется: если она есть, из неё берутся
 * логотип и описание, а бренд без единого проекта остаётся в ролле как
 * proof-only строка — без ссылки, которая никуда не ведёт.
 */
import type { Project } from '@/features/projects/api'
import type { Client } from '@/lib/api/clients'

/**
 * Значения `projects.client`, которые описывают не заказчика, а тип работы.
 * В ролл брендов они не попадают: «Социальный проект» — это категория, и
 * показывать её рядом с ZARINA значило бы выдавать её за клиента.
 */
const NON_BRAND_CLIENT_LABELS = new Set(['социальный проект', 'личный проект', 'без клиента'])

export interface ClientRollProject {
  id: string
  slug: string
  title: string
  category: Project['category']
  categoryLabel: string
  year: number | null
  /** Кадр из проекта: реальный still, а не превью-гифка плеера */
  still: string | null
  isAI: boolean
  displayOrder: number
}

export interface ClientRollEntry {
  /** Стабильный ключ для React и аналитики */
  id: string
  /** Имя бренда ровно так, как его записали в проекте */
  name: string
  /** Логотип из CMS. Если его нет, плитка живёт на типографике, а не на подделке */
  logoUrl: string | null
  /** Описание из CMS-записи клиента, если её завели */
  note: string | null
  projects: ClientRollProject[]
  /** Проект, который представляет бренд в ролле */
  primary: ClientRollProject | null
  /** Порядок: наследуется от кураторского display_order проектов */
  order: number
}

export interface ClientRoll {
  entries: ClientRollEntry[]
  /** Диапазон лет по проектам ролла, например «2023 / 2025» */
  yearRange: string | null
  /** Число брендов в ролле — реальное, не округлённое до «50+» */
  brandCount: number
  /** Число опубликованных проектов этих брендов */
  projectCount: number
}

export function categoryLabelRu(category: string | null | undefined): string {
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

/** Русское склонение при числительном: «1 проект», «2 проекта», «5 проектов» */
export function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(count) % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  switch (Math.abs(count) % 10) {
    case 1:
      return one
    case 2:
    case 3:
    case 4:
      return few
    default:
      return many
  }
}

/** Ключ сопоставления бренда: «WELLERY», «Wellery» и « wellery » — один клиент */
export function normalizeClientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function isBrandLabel(name: string): boolean {
  const normalized = normalizeClientName(name)
  return normalized.length > 0 && !NON_BRAND_CLIENT_LABELS.has(normalized)
}

/**
 * Кадр для плитки. Берём настоящий стилл из галереи проекта: `thumbnail_url` у
 * части проектов — это анимированная preview.webp из Bunny, она весит больше и
 * не проходит через next/image.
 */
export function pickStill(project: Project): string | null {
  const fromGallery = project.images?.find(
    image => typeof image === 'string' && image.trim() !== ''
  )
  if (fromGallery) return fromGallery
  if (project.cover_image_url) return project.cover_image_url
  if (project.thumbnail_url) return project.thumbnail_url
  return null
}

function toRollProject(project: Project): ClientRollProject {
  return {
    id: String(project.id),
    slug: project.slug,
    title: project.title_ru || project.title || '',
    category: project.category,
    categoryLabel: categoryLabelRu(project.category),
    year: project.year ?? null,
    still: pickStill(project),
    isAI: project.category === 'ai-content',
    displayOrder: project.display_order ?? Number.MAX_SAFE_INTEGER,
  }
}

/**
 * Собирает ролл клиентов из проектов и CMS-записей.
 *
 * Порядок внутри бренда и между брендами наследует `display_order` проектов:
 * то, что студия вынесла вперёд в портфолио, идёт вперёд и здесь.
 */
export function buildClientRoll(
  projects: Project[],
  cmsClients: Client[] = [],
  /**
   * Нормализованные имена брендов, которые должны идти первыми. Это редакторское
   * решение о порядке, а не о данных: узнаваемое имя обязано попасться в первые
   * секунды, иначе proof срабатывает уже после того, как человек решил уходить.
   */
  priorityNames: string[] = []
): ClientRoll {
  const priority = new Map(priorityNames.map((name, index) => [normalizeClientName(name), index]))
  const rank = (name: string) => priority.get(normalizeClientName(name)) ?? Number.MAX_SAFE_INTEGER
  const cmsByName = new Map<string, Client>()
  for (const client of cmsClients) {
    if (!client?.name) continue
    cmsByName.set(normalizeClientName(client.name), client)
  }

  const grouped = new Map<string, { name: string; projects: ClientRollProject[] }>()

  for (const project of projects) {
    const rawName = project.client?.trim()
    if (!rawName || !isBrandLabel(rawName) || !project.slug) continue

    const key = normalizeClientName(rawName)
    const bucket = grouped.get(key)
    if (bucket) {
      bucket.projects.push(toRollProject(project))
    } else {
      grouped.set(key, { name: rawName, projects: [toRollProject(project)] })
    }
  }

  const entries: ClientRollEntry[] = []

  for (const [key, bucket] of grouped) {
    const sorted = [...bucket.projects].sort((a, b) => a.displayOrder - b.displayOrder)
    const cms = cmsByName.get(key)
    const primary = sorted.find(project => project.still !== null) ?? sorted[0] ?? null

    entries.push({
      id: key,
      name: cms?.name?.trim() || bucket.name,
      logoUrl: cms?.logo_url?.trim() || null,
      note: cms?.description?.trim() || null,
      projects: sorted,
      primary,
      order: sorted[0]?.displayOrder ?? Number.MAX_SAFE_INTEGER,
    })
  }

  const byRankThenOrder = (a: ClientRollEntry, b: ClientRollEntry) => {
    const rankDiff = rank(a.name) - rank(b.name)
    if (rankDiff !== 0) return rankDiff
    if (a.order !== b.order) return a.order - b.order
    return a.name.localeCompare(b.name, 'ru')
  }

  entries.sort(byRankThenOrder)

  // Бренды, заведённые в CMS, но пока без опубликованного проекта: показываем как
  // доказательство работы, но без ссылки — вести некуда, и имитировать переход нельзя.
  const proofOnly: ClientRollEntry[] = []
  for (const [key, client] of cmsByName) {
    if (grouped.has(key) || !client.name?.trim() || !isBrandLabel(client.name)) continue
    proofOnly.push({
      id: key,
      name: client.name.trim(),
      logoUrl: client.logo_url?.trim() || null,
      note: client.description?.trim() || null,
      projects: [],
      primary: null,
      order: client.order ?? Number.MAX_SAFE_INTEGER,
    })
  }
  proofOnly.sort(byRankThenOrder)

  const all = [...entries, ...proofOnly]

  const years = all
    .flatMap(entry => entry.projects.map(project => project.year))
    .filter((year): year is number => typeof year === 'number')
  const yearRange = years.length === 0 ? null : `${Math.min(...years)} / ${Math.max(...years)}`

  return {
    entries: all,
    yearRange,
    brandCount: all.length,
    projectCount: all.reduce((total, entry) => total + entry.projects.length, 0),
  }
}

/** Быстрый доступ к проекту по slug — нужен блокам «коллаборации» и «задачи» */
export function indexProjectsBySlug(projects: Project[]): Map<string, Project> {
  const index = new Map<string, Project>()
  for (const project of projects) {
    if (project.slug) index.set(project.slug, project)
  }
  return index
}
