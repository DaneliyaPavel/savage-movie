/**
 * Раздел направлений производства.
 *
 * Не каталог услуг, а коммерческий роутер: человек узнаёт свою задачу, видит
 * работу, которая её доказывает, и уходит либо на страницу направления, либо
 * в бриф. Поэтому страница серверная — заголовки, копия, названия брендов и
 * ссылки на работы должны быть в HTML первого ответа, а не появляться после
 * гидратации.
 *
 * Отдельных /uslugi-spb и /uslugi-moskva не заводим: две почти одинаковые
 * страницы под два города — это дорвеи. География выражена в тексте, в
 * метаданных и через areaServed в разметке.
 */
import type { Metadata } from 'next'

import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { getProjectsServer, type Project } from '@/features/projects/api'
import { logger } from '@/lib/utils/logger'
import { SERVICES_PATH } from '@/lib/services/directions'
import { heroMontage, resolveDirections, type ResolvedDirection } from '@/lib/services/proof'

import { ServicesPageClient } from './client'

/** Контент собирается из портфолио: обновляем раз в час, как и главную */
export const revalidate = 3600

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'

const title = 'Видеопродакшн для брендов — услуги Savage Movie | СПб и Москва'
const description =
  'Рекламные ролики, fashion и beauty video, AI-production, корпоративные фильмы, музыкальные клипы и регулярный контент. Санкт-Петербург, Москва, проекты по России.'

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: SERVICES_PATH,
  },
  /*
   * openGraph задаётся целиком. Next.js заменяет этот объект, а не сливает его
   * по полям с корневым layout: частичный override с одними title и
   * description выбросил бы image, url, type, locale и siteName, и ссылка на
   * раздел ушла бы в мессенджеры без превью.
   */
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'SAVAGE MOVIE',
    url: `${baseUrl}${SERVICES_PATH}`,
    title,
    description,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Savage Movie — направления видеопроизводства',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

function buildJsonLd(directions: ResolvedDirection[]) {
  const pageUrl = `${baseUrl}${SERVICES_PATH}`

  /*
   * Одна Service на страницу, а не семь. Семь конкурирующих Service на одном
   * URL — это семь заявлений о том, что страница посвящена каждому из них;
   * направления правильнее выразить каталогом внутри одной услуги.
   *
   * url у элементов каталога нет сознательно: у шести направлений собственной
   * страницы пока не существует, а ссылаться в разметке на ненаписанный
   * маршрут — прямой путь к 404 в отчётах поиска.
   */
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    name: 'Производство видео для брендов и бизнеса',
    serviceType: 'Видеопродакшн',
    description,
    url: pageUrl,
    provider: { '@id': `${baseUrl}/#organization` },
    areaServed: [
      { '@type': 'City', name: 'Санкт-Петербург' },
      { '@type': 'City', name: 'Москва' },
      { '@type': 'Country', name: 'Россия' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Направления производства',
      itemListElement: directions.map((direction, index) => ({
        '@type': 'Offer',
        position: index + 1,
        itemOffered: {
          '@type': 'Service',
          name: direction.title,
          description: direction.description,
          // url появляется только у направления с существующей страницей
          ...(direction.route.published && direction.route.path
            ? { url: `${baseUrl}${direction.route.path}` }
            : {}),
        },
      })),
    },
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Услуги', item: pageUrl },
    ],
  }

  // Описания приходят из конфигурации, но экранируем так же, как на
  // коммерческом лендинге: `</script>` внутри текста закрыл бы тег и вынес
  // содержимое JSON-LD в разметку страницы.
  return [service, breadcrumbs].map(entry => JSON.stringify(entry).replace(/</g, '\\u003c'))
}

export default async function ServicesPage() {
  // Без портфолио раздел деградирует до текстовой версии — заголовки, копия и
  // CTA остаются на месте, исчезают только кадры и ссылки на работы.
  const projects = await getProjectsServer().catch((error: unknown) => {
    logger.error('Не удалось загрузить проекты для раздела направлений', error, {
      route: SERVICES_PATH,
    })
    return [] as Project[]
  })

  const directions = resolveDirections(projects)
  const montage = heroMontage(directions)

  return (
    <>
      <JsonLdScripts scripts={buildJsonLd(directions)} />
      <ServicesPageClient directions={directions} montage={montage} />
    </>
  )
}
