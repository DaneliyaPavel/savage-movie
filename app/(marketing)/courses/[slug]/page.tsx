/**
 * Детальная страница курса
 */
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getCourseBySlug } from '@/features/courses/api'
import { VideoPlayer } from '@/features/projects/components/VideoPlayer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { CheckCircle2, Clock, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CourseEnrollmentButton } from '@/features/courses/components/CourseEnrollmentButton'
import type { Course } from '@/features/courses/api'

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  let course: Course | null = null

  try {
    course = await getCourseBySlug(params.slug)
  } catch (error) {
    console.warn('Ошибка загрузки курса:', error)
  }

  if (!course) {
    notFound()
  }

  // Модули уже загружены вместе с курсом и отсортированы
  const modulesWithLessons = course.modules || []

  const categoryLabels: Record<string, string> = {
    ai: 'ИИ-генерация',
    shooting: 'Съемка',
    editing: 'Монтаж',
    production: 'Продакшн',
  }

  // Извлекаем playback ID из Mux URL
  const getPlaybackId = (url: string | null) => {
    if (!url) return null
    const muxMatch = url.match(/mux\.com\/([^/?]+)/)
    if (muxMatch) return muxMatch[1]
    return null
  }

  const promoPlaybackId = course.video_promo_url ? getPlaybackId(course.video_promo_url) : null

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full aspect-video bg-muted">
        {promoPlaybackId ? (
          <VideoPlayer
            playbackId={promoPlaybackId}
            title={course.title}
            controls
            className="w-full h-full"
          />
        ) : course.video_promo_url ? (
          <video src={course.video_promo_url} controls className="w-full h-full object-cover" />
        ) : course.cover_image ? (
          <Image
            src={course.cover_image}
            alt={course.title}
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Breadcrumbs
              items={[{ label: 'Курсы', href: '/courses' }, { label: course.title }]}
              className="mb-4"
            />
            <BackButton href="/courses" className="mb-4" />
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary">{categoryLabels[course.category]}</Badge>
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">{course.title}</h1>
            {course.description && (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{course.description}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Длительность</p>
                    <p className="font-semibold">{course.duration || 'N/A'} мин</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Инструктор</p>
                    <p className="font-semibold">SAVAGE MOVIE</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Цена</p>
                  <p className="text-2xl font-heading font-bold text-primary">
                    {Number(course.price).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <div className="mb-12">
            <CourseEnrollmentButton
              courseId={course.id}
              courseTitle={course.title}
              price={Number(course.price)}
            />
          </div>

          {/* What You'll Learn */}
          {course.what_you_learn && course.what_you_learn.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Что вы узнаете</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.what_you_learn.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Требования</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-primary">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Curriculum */}
          {modulesWithLessons && modulesWithLessons.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Программа курса</CardTitle>
                <CardDescription>
                  {modulesWithLessons.length} модулей,{' '}
                  {modulesWithLessons.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} уроков
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {modulesWithLessons.map(module => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{module.title}</span>
                          <Badge variant="outline" className="ml-auto">
                            {module.lessons?.length || 0} уроков
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 mt-2">
                          {module.lessons?.map(lesson => (
                            <li key={lesson.id} className="flex items-center gap-3 text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{lesson.title}</span>
                              {lesson.duration && (
                                <span className="text-muted-foreground ml-auto">
                                  {Math.floor(lesson.duration / 60)}:
                                  {(lesson.duration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Reviews Section - можно добавить позже */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Отзывы</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Отзывы будут добавлены позже</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
