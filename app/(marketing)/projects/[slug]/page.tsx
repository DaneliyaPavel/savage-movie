/**
 * Детальная страница проекта
 */
import { notFound } from 'next/navigation'
import { getProjectBySlug } from '@/lib/api/projects'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Calendar, Clock, User, Wrench } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { Project } from '@/lib/api/projects'

export default async function ProjectDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  let project: Project | null = null
  
  try {
    project = await getProjectBySlug(params.slug)
  } catch (error) {
    console.warn('Ошибка загрузки проекта:', error)
  }

  if (!project) {
    notFound()
  }

  const categoryLabels: Record<string, string> = {
    commercial: 'Коммерция',
    'ai-content': 'ИИ-контент',
    'music-video': 'Клип',
    other: 'Другое',
  }

  // Извлекаем playback ID из Mux URL, если это Mux видео
  const getPlaybackId = (url: string | null) => {
    if (!url) return null
    // Если это Mux URL вида https://stream.mux.com/{playbackId}
    const muxMatch = url.match(/mux\.com\/([^/?]+)/)
    if (muxMatch) return muxMatch[1]
    return null
  }

  const playbackId = project.video_url ? getPlaybackId(project.video_url) : null

  return (
    <div className="min-h-screen">
      {/* Hero Video */}
      <div className="relative w-full aspect-video bg-muted">
        {playbackId ? (
          <VideoPlayer
            playbackId={playbackId}
            title={project.title}
            controls
            className="w-full h-full"
          />
        ) : project.video_url ? (
          <video
            src={project.video_url}
            controls
            className="w-full h-full object-cover"
          />
        ) : project.images?.[0] ? (
          <Image
            src={project.images[0]}
            alt={project.title}
            fill
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary">
                {categoryLabels[project.category]}
              </Badge>
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              {project.title}
            </h1>
            {project.description && (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{project.description}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {project.client && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Клиент</p>
                      <p className="font-semibold">{project.client}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.duration && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Длительность</p>
                      <p className="font-semibold">
                        {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.role && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Роль</p>
                      <p className="font-semibold">{project.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.tools && project.tools.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Инструменты</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tools.map((tool, index) => (
                          <Badge key={index} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gallery */}
          {project.images && project.images.length > 0 && (
            <div className="mb-12">
              <h2 className="font-heading font-bold text-2xl mb-6">Галерея</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.images.map((image, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} - изображение ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behind the Scenes */}
          {project.behind_scenes && project.behind_scenes.length > 0 && (
            <div className="mb-12">
              <h2 className="font-heading font-bold text-2xl mb-6">За кадром</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.behind_scenes.map((image, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`${project.title} - за кадром ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center py-12 border-t border-border">
            <h2 className="font-heading font-bold text-3xl mb-4">
              Хотите похожий проект?
            </h2>
            <p className="text-muted-foreground mb-6">
              Свяжитесь с нами, и мы обсудим ваш проект
            </p>
            <Link href="/booking">
              <Button size="lg">
                Заказать проект
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
