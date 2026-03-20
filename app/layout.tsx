import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'

// Handwritten font "Sa No Rules Regular" - next/font/local fails build if files are missing; fallback is runtime only.
const saNoRules = localFont({
  src: [
    {
      path: '../public/fonts/SANoRulesRegular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SANoRulesRegular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SANoRulesRegular.ttf',
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
  alternates: {
    canonical: '/',
  },
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
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/sm_logo.svg', type: 'image/svg+xml' },
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
  '@type': 'VideoProductionCompany',
  name: 'Savage Movie',
  url: baseUrl,
  logo: `${baseUrl}/sm-logo.svg`,
  description: 'Продакшн-студия полного цикла в Санкт-Петербурге',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Санкт-Петербург',
    addressCountry: 'RU',
  },
  areaServed: ['Санкт-Петербург', 'Москва', 'Россия'],
  serviceType: [
    'Видеопродакшн',
    'Рекламные ролики',
    'Музыкальные клипы',
    'AI-генерация видео',
    'Обучение видеопроизводству',
  ],
  sameAs: [
    'https://vk.ru/mari_seven',
    'https://t.me/mariseven',
    'https://www.instagram.com/mari.seven/',
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
      <body className={`${saNoRules.variable} font-sans antialiased`}>
        <JsonLdScripts scripts={jsonLdScripts} />
        {children}
      </body>
    </html>
  )
}
