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
  'Полный цикл видеопродакшна: реклама, клипы, имиджевые видео. Обучение ИИ-генерации, съемке и монтажу. Savage Movie.'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
} as const

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'SAVAGE MOVIE | Видеопродакшн | ИИ-генерация | Обучение',
  description: metaDescription,
  keywords: [
    'видеопродакшн',
    'ИИ-генерация',
    'обучение видео',
    'съемка',
    'монтаж',
    'продюсирование',
  ],
  icons: {
    icon: '/sm_logo.svg',
    shortcut: '/sm_logo.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'SAVAGE MOVIE',
    title: 'SAVAGE MOVIE | Видеопродакшн | ИИ-генерация | Обучение',
    description: metaDescription,
    images: [{ url: '/apple-touch-icon.png', width: 180, height: 180, alt: 'SAVAGE MOVIE' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SAVAGE MOVIE | Видеопродакшн | ИИ-генерация | Обучение',
    description: metaDescription,
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SAVAGE MOVIE',
  url: baseUrl,
  logo: `${baseUrl}/sm_logo.svg`,
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
