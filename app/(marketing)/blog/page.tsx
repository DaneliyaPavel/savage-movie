/**
 * Страница блога
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'

// Временные данные для блога (в будущем будут из Supabase)
const blogPosts = [
  {
    id: '1',
    title: 'Как использовать ИИ для создания видео',
    slug: 'ai-video-creation',
    excerpt: 'Изучите возможности ИИ-генерации видео с помощью современных инструментов.',
    category: 'ИИ-генерация',
    publishedAt: new Date('2024-01-15'),
    image: null,
  },
  // Добавьте больше постов
]

export default function BlogPage() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="font-heading font-bold text-5xl md:text-6xl mb-4">
            Блог
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Полезные статьи о видеопродакшне, ИИ-генерации и обучении
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4" />
                    {format(post.publishedAt, 'd MMMM yyyy', { locale: ru })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {blogPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Статьи скоро появятся</p>
          </div>
        )}
      </div>
    </div>
  )
}
