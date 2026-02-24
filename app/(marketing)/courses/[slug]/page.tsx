/**
 * Детальная страница курса
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCourseBySlugServer } from '@/features/courses/api'
import { Badge } from '@/components/ui/badge'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { CheckCircle2, Clock, MapPin, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CourseEnrollmentForm } from '@/features/courses/components/CourseEnrollmentForm'
import type { Course } from '@/features/courses/api'
import { getCurrentUserServer } from '@/lib/api/auth'

const SITE_NAME = 'SAVAGE MOVIE'

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trim() + '…'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let course: Course | null = null
  try {
    course = await getCourseBySlugServer(slug)
  } catch {
    course = null
  }
  if (!course) return { title: SITE_NAME }

  const title = truncate(`${course.title} | Курсы | ${SITE_NAME}`, 60)
  const description = course.short_description ?? course.description
    ? truncate(
        (course.short_description || course.description || '').replace(/\s+/g, ' ').trim(),
        160
      )
    : `Курс ${course.title} — обучение видеопродакшну, ИИ-генерации и монтажу. Savage Movie.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: course.cover_image
        ? [{ url: course.cover_image, width: 1200, height: 630, alt: course.title }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  let course: Course | null = null

  try {
    course = await getCourseBySlugServer(slug, cookieStore)
  } catch (error) {
    console.warn('Ошибка загрузки курса:', error)
  }

  if (!course) {
    notFound()
  }

  const user = await getCurrentUserServer(cookieStore)

  // Модули уже загружены вместе с курсом и отсортированы
  const modulesWithLessons = course.modules || []

  const categoryLabels: Record<string, string> = {
    ai: 'ИИ-генерация',
    shooting: 'Съемка',
    editing: 'Монтаж',
    production: 'Продакшн',
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'
  const courseUrl = `${baseUrl}/courses/${slug}`
  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description:
      (course.short_description || course.description || '').replace(/\s+/g, ' ').trim() ||
      `Курс ${course.title} — обучение видеопродакшну, ИИ-генерации и монтажу. Savage Movie.`,
    url: courseUrl,
    image: course.cover_image ?? undefined,
    provider: {
      '@type': 'Organization',
      name: 'SAVAGE MOVIE',
      url: baseUrl,
    },
  }

  return (
    <div className="min-h-screen">
      <JsonLdScripts scripts={[JSON.stringify(courseJsonLd)]} />
      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Breadcrumbs
              items={[{ label: 'Курсы', href: '/courses' }, { label: course.title }]}
              className="mb-4"
            />
            <BackButton href="/courses" className="mb-4" />
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryLabels[course.category]}</Badge>
              {course.tags?.length ? (
                course.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">
                    {tag}
                  </Badge>
                ))
              ) : null}
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">{course.title}</h1>
            {course.description && (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{course.description}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Длительность</p>
                    <p className="font-semibold">
                      {course.duration_text ?? (course.duration != null ? `${course.duration} нед.` : 'N/A')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {(course.location_text || course.schedule_text) && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Локация / Расписание</p>
                      <p className="font-semibold">
                        {[course.location_text, course.schedule_text].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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

          {/* Форма записи на курс / переход к оплате */}
          <div className="mb-12">
            <CourseEnrollmentForm
              courseId={course.id}
              courseTitle={course.title}
              price={Number(course.price)}
              initialUser={user}
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
                        <ul className="mt-3 space-y-0 divide-y divide-border/50">
                          {module.lessons?.map(lesson => (
                            <li
                              key={lesson.id}
                              className="flex items-center gap-3 py-3 first:pt-0 text-sm"
                            >
                              <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              <span className="min-w-0 flex-1">{lesson.title}</span>
                              {lesson.duration != null && (
                                <span className="ml-auto flex-shrink-0 text-muted-foreground">
                                  {lesson.duration} мин
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
