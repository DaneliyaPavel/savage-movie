/**
 * Метаданные и JSON-LD страницы /about.
 *
 * Разметка описывает только то, что видно на странице и проверяемо: AboutPage
 * ссылается на Organization из корневого layout (@id), а не дублирует её;
 * реквизитов, адреса, рейтингов и персон здесь нет. FAQPage повторяет ровно
 * тексты вопросов страницы.
 */
import type { Metadata } from 'next'

import { ABOUT_FAQ, ABOUT_PATH, ABOUT_SEO } from './content'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'
const pageUrl = `${baseUrl}${ABOUT_PATH}`

/** canonical задаётся в самом page.tsx (см. canonical-architecture.test.ts), здесь его нет */
export function aboutMetadata(): Metadata {
  const { title, description, keywords } = ABOUT_SEO
  return {
    title,
    description,
    keywords: [...keywords],
    /* openGraph задаётся целиком: Next заменяет объект, а не сливает с корневым layout */
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: 'SAVAGE MOVIE',
      url: pageUrl,
      title,
      description,
      images: [
        {
          url: `${ABOUT_PATH}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: 'Savage Movie — продакшн-студия',
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function aboutJsonLd(): string[] {
  const aboutPage = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: ABOUT_SEO.title,
    description: ABOUT_SEO.description,
    inLanguage: 'ru',
    isPartOf: { '@type': 'WebSite', name: 'SAVAGE MOVIE', url: baseUrl },
    about: { '@id': `${baseUrl}/#organization` },
    mainEntity: { '@id': `${baseUrl}/#organization` },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'О студии', item: pageUrl },
    ],
  }

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ABOUT_FAQ.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  // `</script>` внутри текста закрыл бы тег: JsonLdScripts дополнительно экранирует `<`
  return [aboutPage, breadcrumbs, faq].map(entry => JSON.stringify(entry))
}
