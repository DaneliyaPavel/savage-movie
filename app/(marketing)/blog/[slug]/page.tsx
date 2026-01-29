import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'

import { Badge } from '@/components/ui/badge'
import { getBlogPostBySlugServer } from '@/lib/api/blog'
import ReactMarkdown from 'react-markdown'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'

export const dynamic = 'force-dynamic'

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let post
  try {
    post = await getBlogPostBySlugServer(slug)
  } catch {
    post = null
  }
  if (!post) return notFound()

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад в блог
            </Link>
          </div>

          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="secondary">{post.category || 'Блог'}</Badge>
              {post.reading_time && (
                <span className="text-sm text-muted-foreground">{post.reading_time}</span>
              )}
            </div>

            <h1 className="font-heading font-bold text-4xl md:text-5xl leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{post.author || 'Savage Movie'}</span>
              <span className="opacity-40">•</span>
              <span className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {post.published_at || post.created_at
                  ? format(new Date(post.published_at || post.created_at), 'd MMMM yyyy', {
                      locale: ru,
                    })
                  : 'Дата не указана'}
              </span>
            </div>
          </header>

          <article className="space-y-6">
            {post.content ? (
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight pt-4">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl md:text-2xl font-semibold tracking-tight pt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-lg leading-relaxed text-foreground/90">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-2 text-foreground/90">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-2 text-foreground/90">{children}</ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                }}
              >
                {post.content}
              </ReactMarkdown>
            ) : (
              <p className="text-lg leading-relaxed text-foreground/90">
                Текст статьи скоро появится.
              </p>
            )}
          </article>
        </div>
      </section>
    </main>
  )
}
