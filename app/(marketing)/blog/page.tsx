/**
 * Страница блога
 */
import type { Metadata } from 'next'
import { getBlogPostsServer, type BlogPost } from '@/lib/api/blog'
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
}

export default async function BlogPage() {
  let posts: BlogPost[] = []
  try {
    posts = await getBlogPostsServer(true)
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
