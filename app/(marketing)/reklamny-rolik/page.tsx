/**
 * Коммерческая посадочная страница «Рекламные ролики».
 *
 * Точка приземления горячего поискового трафика Яндекс.Директа и органики
 * по кластеру рекламного видеопроизводства. Серверный компонент: контент,
 * кейсы и структурные данные уходят в HTML сразу, поэтому осмысленный текст
 * страницы доступен поиску без исполнения скриптов.
 *
 * Одна страница на три географии. Отдельные /moskva и /spb не заводим, пока
 * Вебмастер и Директ не подтвердят самостоятельный geo-спрос: две почти
 * одинаковые страницы — это дорвеи, а не SEO.
 */
import type { Metadata } from 'next'

import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { getProjectsServer, type Project } from '@/features/projects/api'
import type { Client } from '@/lib/api/clients'
import { getCommercialLandingContent } from '@/lib/commercial-landing/server'
import {
  COMMERCIAL_LANDING_PATH,
  type CommercialLandingContent,
} from '@/lib/commercial-landing/content'
import { getThumbnailUrl } from '@/lib/integrations/bunny/client'
import { normalizePosterUrl } from '@/lib/commercial-landing/poster-url'
import { logger } from '@/lib/utils/logger'
import type { CommercialCase } from '@/components/sections/commercial/commercial-cases'
import { CommercialLandingClient } from './client'

/**
 * ISR. Страница статична между правками, но собирается из CMS: если во время
 * сборки образа бэкенд недоступен, в бандл попадут дефолты и пустой список
 * кейсов — и без периодического обновления они там и останутся до следующего
 * деплоя. Правки из админки прилетают быстрее, через revalidatePath.
 */
export const revalidate = 600

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'

/** Контент нужен и метаданным, и рендеру — на одном рендере это один запрос */
async function loadContent(): Promise<CommercialLandingContent> {
  return getCommercialLandingContent()
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent()
  const { seo } = content

  return {
    title: seo.title,
    description: seo.description,
    keywords: [
      'заказать рекламный ролик',
      'создание рекламного ролика',
      'производство рекламных роликов',
      'съёмка рекламного ролика',
      'рекламный ролик для бизнеса',
      'стоимость рекламного ролика',
      'видеопродакшн под ключ',
      'видеопродакшн для бизнеса',
    ],
    alternates: {
      canonical: COMMERCIAL_LANDING_PATH,
    },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: 'SAVAGE MOVIE',
      url: `${baseUrl}${COMMERCIAL_LANDING_PATH}`,
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [
        {
          // Своя коммерческая картинка, а не случайный кадр главной
          url: seo.ogImageUrl || `${COMMERCIAL_LANDING_PATH}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: seo.ogTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
    },
  }
}

function posterFor(project: Project): string | null {
  if (project.thumbnail_url) return normalizePosterUrl(project.thumbnail_url)
  if (project.cover_image_url) return normalizePosterUrl(project.cover_image_url)
  if (project.images?.[0]) return normalizePosterUrl(project.images[0])
  if (project.mux_playback_id) return getThumbnailUrl(project.mux_playback_id)
  return null
}

/**
 * Собирает карточки кейсов.
 *
 * Приоритетные слаги задаются в CMS, недостающие места добираются сильными
 * коммерческими работами по категории — так четвёртый кейс не оказывается
 * захардкоженным и переживает изменения портфолио.
 */
function buildCases(content: CommercialLandingContent, projects: Project[]): CommercialCase[] {
  const bySlug = new Map(projects.map(project => [project.slug, project]))
  const contexts = new Map(content.cases.contexts.map(context => [context.slug, context]))

  const chosen: Project[] = []
  const taken = new Set<string>()

  for (const slug of content.cases.featuredSlugs) {
    const project = bySlug.get(slug)
    if (project && !taken.has(slug)) {
      chosen.push(project)
      taken.add(slug)
    }
  }

  if (chosen.length < content.cases.limit) {
    const fallback = projects
      .filter(project => project.category === 'commercial' && !taken.has(project.slug))
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))

    for (const project of fallback) {
      if (chosen.length >= content.cases.limit) break
      chosen.push(project)
      taken.add(project.slug)
    }
  }

  return chosen.slice(0, content.cases.limit).map(project => {
    const context = contexts.get(project.slug)
    return {
      slug: project.slug,
      title: project.title_ru || project.title,
      client: project.client || project.title,
      year: project.year ? String(project.year) : '',
      playbackId: project.mux_playback_id || project.video_url || null,
      posterUrl: posterFor(project),
      kind: context?.kind || 'Коммерческий проект',
      meta: context?.meta || 'Рекламный ролик',
    }
  })
}

function buildJsonLd(content: CommercialLandingContent, projects: Project[], cases: CommercialCase[]) {
  const pageUrl = `${baseUrl}${COMMERCIAL_LANDING_PATH}`
  const projectBySlug = new Map(projects.map(project => [project.slug, project]))

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    name: 'Производство рекламных видеороликов',
    serviceType: 'Производство рекламных видеороликов',
    description: content.seo.description,
    url: pageUrl,
    provider: { '@id': `${baseUrl}/#organization` },
    areaServed: [
      { '@type': 'City', name: 'Санкт-Петербург' },
      { '@type': 'City', name: 'Москва' },
      { '@type': 'Country', name: 'Россия' },
    ],
    // Диапазоны совпадают с блоком стоимости и со статьёй о бюджете
    offers: content.pricing.tiers.map(tier => ({
      '@type': 'Offer',
      name: tier.name,
      description: tier.range,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
    })),
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Услуги', item: `${baseUrl}/services` },
      { '@type': 'ListItem', position: 3, name: 'Рекламные ролики', item: pageUrl },
    ],
  }

  // VideoObject только для кейсов, у которых действительно есть видео и превью:
  // размечать несуществующий ролик хуже, чем не размечать вовсе
  const videos = cases
    .filter(item => item.playbackId && item.posterUrl)
    .map(item => {
      const project = projectBySlug.get(item.slug)
      const thumbnail = item.posterUrl as string

      return {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: `${item.client} — ${item.title}`,
        description: project?.description || `${item.kind}. ${item.meta}.`,
        thumbnailUrl: thumbnail.startsWith('http') ? thumbnail : `${baseUrl}${thumbnail}`,
        uploadDate: project?.created_at || new Date().toISOString(),
        // duration указываем только когда она известна из CMS
        ...(project?.duration
          ? { duration: `PT${Math.floor(project.duration / 60)}M${project.duration % 60}S` }
          : {}),
        ...(project?.video_url ? { embedUrl: project.video_url } : {}),
        contentUrl: `${baseUrl}/projects/${item.slug}`,
        publisher: { '@id': `${baseUrl}/#organization` },
      }
    })

  // Описания кейсов приходят из CMS: экранируем `<`, иначе `</script>` внутри
  // текста закрыл бы тег и вынес содержимое JSON-LD в разметку страницы
  return [service, breadcrumbs, ...videos].map(entry =>
    JSON.stringify(entry).replace(/</g, '\\u003c')
  )
}

export default async function CommercialLandingPage() {
  const content = await loadContent()

  // Кейсы и логотипы не должны валить страницу: без них лендинг деградирует
  // до текстовой версии, но остаётся рабочим
  const [projects, clients] = await Promise.all([
    getProjectsServer().catch(error => {
      logger.error('Не удалось загрузить проекты для лендинга', error, {
        route: COMMERCIAL_LANDING_PATH,
      })
      return [] as Project[]
    }),
    (async () => {
      try {
        const { apiGet } = await import('@/lib/api/server')
        return await apiGet<Client[]>('/api/clients')
      } catch (error) {
        logger.error('Не удалось загрузить клиентов для лендинга', error, {
          route: COMMERCIAL_LANDING_PATH,
        })
        return [] as Client[]
      }
    })(),
  ])

  const cases = buildCases(content, projects)
  // Все реально опубликованные проекты, а не только 4 карточки на лендинге —
  // WhySavage сверяет с этим список, доказывающий кейс может не входить в грид
  const allCaseSlugs = projects.map(project => project.slug)

  return (
    <>
      <JsonLdScripts scripts={buildJsonLd(content, projects, cases)} />
      <CommercialLandingClient
        content={content}
        cases={cases}
        clients={clients}
        allCaseSlugs={allCaseSlugs}
      />
    </>
  )
}
