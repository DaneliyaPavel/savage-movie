/**
 * Страница блога
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { getBlogPostsServer, type BlogPost } from '@/lib/api/blog'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'

export const dynamic = 'force-dynamic'

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

      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-5xl md:text-6xl mb-4">Блог</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Полезные статьи о видеопродакшне, ИИ-генерации и обучении
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              const dateStr = post.published_at || post.created_at
              const publishedAt = dateStr ? new Date(dateStr) : null
              const isValidDate = publishedAt && !isNaN(publishedAt.getTime())
              return (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{post.category || 'Блог'}</Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {isValidDate
                          ? format(publishedAt, 'd MMMM yyyy', { locale: ru })
                          : 'Дата не указана'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.excerpt || 'Описание появится позже.'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Статьи скоро появятся</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
