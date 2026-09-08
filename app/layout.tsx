import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { YandexMetrika } from '@/components/analytics/yandex-metrika'
import { TokenBootstrap } from '@/components/providers/token-bootstrap'
import { EMAIL, PHONE_DISPLAY, PHONE_E164 } from '@/lib/contacts'

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
   * deprecated из-за путаницы с Service.
   *
   * PostalAddress здесь сознательно отсутствует. Публичного офиса у студии нет,
   * а адрес регистрации ИП из «Политики обработки ПД» — не адрес бизнеса и в
   * разметке ему не место. География выражена через areaServed.
   */
  '@type': 'Organization',
  name: 'Savage Movie',
  legalName: 'ИП Плешивцева Мария Михайловна',
  url: baseUrl,
  logo: `${baseUrl}/sm-logo.svg`,
  description: 'Продакшн-студия полного цикла в Санкт-Петербурге',
  telephone: PHONE_DISPLAY,
  email: EMAIL,
  // ИНН. Отдельного свойства под российские реквизиты у schema.org нет,
  // taxID — штатное место для налогового идентификатора организации.
  taxID: '780526847456',
  // ОГРНИП в taxID не помещается: это другой идентификатор. Валидный способ
  // отдать произвольный реквизит — identifier с PropertyValue.
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'ОГРНИП',
    value: '321784700027149',
  },
  areaServed: [
    { '@type': 'City', name: 'Санкт-Петербург' },
    { '@type': 'AdministrativeArea', name: 'Ленинградская область' },
    { '@type': 'City', name: 'Москва' },
    { '@type': 'Country', name: 'Россия' },
  ],
  /*
   * Часы работы идут через contactPoint, а не через openingHours: у
   * openingHours domainIncludes только CivicStructure и LocalBusiness, у
   * openingHoursSpecification — только Place. На Organization оба невалидны.
   * hoursAvailable на ContactPoint — единственный корректный путь.
   */
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: PHONE_E164,
    email: EMAIL,
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'https://schema.org/Monday',
        'https://schema.org/Tuesday',
        'https://schema.org/Wednesday',
        'https://schema.org/Thursday',
        'https://schema.org/Friday',
        'https://schema.org/Saturday',
        'https://schema.org/Sunday',
      ],
      opens: '08:00',
      closes: '22:00',
    },
  },
  // knowsAbout, а не serviceType: у serviceType domainIncludes только Service.
  knowsAbout: [
    'Видеопродакшн',
    'Рекламные ролики',
    'Музыкальные клипы',
    'AI-генерация видео',
    'Обучение видеопроизводству',
  ],
  /*
   * Аккаунты подтверждены владельцем. YouTube указан как @savage-movie:
   * вариант без дефиса отдаёт 404, а мёртвая ссылка в sameAs мешает склейке
   * сущности сильнее, чем её отсутствие.
   */
  sameAs: [
    'https://www.instagram.com/mari.seven/',
    'https://t.me/mariseven',
    'https://vk.ru/mari_seven',
    'https://www.youtube.com/@savage-movie',
  ],
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
