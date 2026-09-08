import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { YandexMetrika } from '@/components/analytics/yandex-metrika'
import { TokenBootstrap } from '@/components/providers/token-bootstrap'

// Handwritten font "Sa No Rules Regular" - next/font/local fails build if files are missing; fallback is runtime only.
const saNoRules = localFont({
  src: [
    {
      path: '../public/fonts/SANoRulesRegular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-handwritten',
  display: 'swap',
  fallback: ['Kalam', 'Caveat', 'cursive'],
})

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'

const metaDescription =
  'Продакшн-студия полного цикла в Санкт-Петербурге и Москве. Рекламные ролики, музыкальные клипы, имиджевые видео, AI-генерация контента. Обсудить проект →'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
} as const

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  /*
   * Здесь НЕТ alternates.canonical. Относительный canonical в корневом layout
   * наследуется всеми маршрутами, которые его не переопределили, и динамические
   * /projects/[slug], /blog/[slug], /courses/[slug] годами объявляли себя
   * дублями главной. Canonical задаётся только на самом маршруте — см.
   * app/__tests__/canonical-architecture.test.ts, который это стережёт.
   */
  title: 'Видеопродакшн в СПб и Москве — Savage Movie | Реклама, клипы, AI-видео',
  description: metaDescription,
  keywords: [
    'видеопродакшн',
    'видеопродакшн спб',
    'видеопродакшн москва',
    'видеосъёмка спб',
    'AI-генерация видео',
    'рекламные ролики',
    'музыкальные клипы',
    'ИИ-генерация',
    'обучение видео',
    'съемка',
    'монтаж',
  ],
  icons: {
    icon: [
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'SAVAGE MOVIE',
    title: 'Видеопродакшн в СПб и Москве — Savage Movie | Реклама, клипы, AI-видео',
    description: metaDescription,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Savage Movie — видеопродакшн в СПб и Москве' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Видеопродакшн в СПб и Москве — Savage Movie | Реклама, клипы, AI-видео',
    description: metaDescription,
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  /*
   * Organization, а не VideoProductionCompany: последнего нет в словаре
   * schema.org — это категория карточки Google Business Profile, которую
   * приняли за тип разметки. И не ProfessionalService: schema.org помечает его
   * как deprecated из-за путаницы с Service.
   *
   * Полей address/telephone/openingHours/foundingDate здесь намеренно не
   * больше, чем подтверждено сайтом: телефона на сайте нет вообще, улицы и
   * индекса тоже. Их место — этап NAP, а не выдуманные значения в разметке.
   */
  '@type': 'Organization',
  name: 'Savage Movie',
  url: baseUrl,
  logo: `${baseUrl}/sm-logo.svg`,
  description: 'Продакшн-студия полного цикла в Санкт-Петербурге',
  address: {
    // Единственное, что подтверждено страницей /contact: город и страна.
    '@type': 'PostalAddress',
    addressLocality: 'Санкт-Петербург',
    addressCountry: 'RU',
  },
  areaServed: ['Санкт-Петербург', 'Москва', 'Россия'],
  // knowsAbout, а не serviceType: у serviceType domainIncludes только Service.
  knowsAbout: [
    'Видеопродакшн',
    'Рекламные ролики',
    'Музыкальные клипы',
    'AI-генерация видео',
    'Обучение видеопроизводству',
  ],
  /*
   * sameAs отсутствует сознательно. Раньше здесь стояли личные профили
   * mari_seven — разметка связывала домен не с той сущностью. Брендовые
   * аккаунты Savage Movie существуют, но пока не подтверждены владельцем,
   * поэтому не утверждаем ничего вместо того, чтобы утверждать неверное.
   */
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SAVAGE MOVIE',
  url: baseUrl,
  publisher: { '@id': `${baseUrl}/#organization` },
  inLanguage: 'ru',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLdScripts = [
    JSON.stringify({ ...organizationJsonLd, '@id': `${baseUrl}/#organization` }),
    JSON.stringify(websiteJsonLd),
  ]

  return (
    <html lang="ru" className="dark">
      <head>
        {/* Bunny CDN is now proxied through /cdn/ — no preconnect needed */}
        <YandexMetrika />
      </head>
      <body className={`${saNoRules.variable} font-sans antialiased`}>
        <JsonLdScripts scripts={jsonLdScripts} />
        <TokenBootstrap />
        {children}
      </body>
    </html>
  )
}
