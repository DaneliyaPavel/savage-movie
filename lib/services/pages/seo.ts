/**
 * Метаданные и JSON-LD страниц направлений.
 *
 * Правила те же, что у /services и /reklamny-rolik: Organization ссылается на
 * корневой @id, адреса нет, areaServed — города и страна, цены в разметке нет
 * (ориентира для направления владелец не утверждал), FAQPage повторяет только
 * то, что видно на странице. Каждая страница — одна Service.
 */
import type { Metadata } from 'next'

import { SERVICES_PATH } from '../directions'
import { directionPath } from './index'
import type { DirectionPageBase } from './types'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'

export function directionMetadata(page: DirectionPageBase): Metadata {
  const path = directionPath(page.id)
  const { title, description, keywords } = page.seo

  return {
    title,
    description,
    keywords,
    /*
     * openGraph задаётся целиком: Next заменяет объект, а не сливает по
     * полям с корневым layout (см. комментарий на /services).
     */
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: 'SAVAGE MOVIE',
      url: `${baseUrl}${path}`,
      title,
      description,
      images: [
        {
          url: `${path}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: page.seo.serviceName,
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function directionJsonLd(page: DirectionPageBase, directionTitle: string): string[] {
  const path = directionPath(page.id)
  const pageUrl = `${baseUrl}${path}`

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    name: page.seo.serviceName,
    serviceType: page.seo.serviceType,
    description: page.seo.description,
    url: pageUrl,
    provider: { '@id': `${baseUrl}/#organization` },
    areaServed: [
      { '@type': 'City', name: 'Санкт-Петербург' },
      { '@type': 'City', name: 'Москва' },
      { '@type': 'Country', name: 'Россия' },
    ],
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Услуги', item: `${baseUrl}${SERVICES_PATH}` },
      { '@type': 'ListItem', position: 3, name: directionTitle, item: pageUrl },
    ],
  }

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  // `</script>` внутри текста закрыл бы тег: экранируем `<`, как на соседних страницах
  return [service, breadcrumbs, faq].map(entry => JSON.stringify(entry).replace(/</g, '\\u003c'))
}
