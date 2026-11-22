/**
 * Страница блога
 */
import type { Metadata } from 'next'
import { getBlogSummariesServer, type BlogPost } from '@/lib/api/blog'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import BlogPageClient from './blog-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Блог о видеопродакшне и AI-генерации — Savage Movie',
  description:
    'Статьи, гайды и кейсы: AI-генерация видео, тренды видеопродакшна, лайфхаки по съёмке и монтажу от студии Savage Movie.',
  alternates: {
    canonical: '/blog',
  },
  /*
   * openGraph задаётся целиком: Next заменяет объект, а не сливает с корневым layout.
   * Без него превью ссылки на /blog уходило в мессенджеры с заголовком главной.
   */
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'SAVAGE MOVIE',
    url: '/blog',
    title: 'Блог о видеопродакшне и AI-генерации — Savage Movie',
    description:
      'Статьи, гайды и кейсы: AI-генерация видео, тренды видеопродакшна, лайфхаки по съёмке и монтажу от студии Savage Movie.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Savage Movie' }],
  },
}

export default async function BlogPage() {
  let posts: BlogPost[] = []
  try {
    // Без текстов статей: лента показывает карточки, а тексты попадали в HTML страницы
    // (~90 КБ из 196 КБ несжатого ответа)
    posts = await getBlogSummariesServer(true)
  } catch {
    posts = []
  }

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />
      <BlogPageClient initialPosts={posts} />
    </main>
  )
}
