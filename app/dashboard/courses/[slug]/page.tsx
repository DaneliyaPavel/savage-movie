/**
 * Страница курса в dashboard студента
 */
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/api/auth'
import { getCourseBySlugServer } from '@/lib/api/courses'
import { getEnrollmentByCourseServer } from '@/lib/api/enrollments'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Play } from 'lucide-react'
import type { Course } from '@/lib/api/courses'
import { cookies } from 'next/headers'

export default async function DashboardCoursePage({
  params,
}: {
  params: { slug: string }
}) {
  // Проверяем аутентификацию
  const cookieStore = await cookies()
  const user = await getCurrentUserServer(cookieStore)

  if (!user) {
    redirect('/')
  }

  // Загружаем курс
  let course: Course | null = null
  try {
    course = await getCourseBySlugServer(params.slug, cookieStore)
  } catch (error) {
    console.warn('Ошибка загрузки курса:', error)
  }

  if (!course) {
    notFound()
  }

  // Проверяем, записан ли пользователь на курс
  let enrollment = null
  try {
    enrollment = await getEnrollmentByCourseServer(course.id, cookieStore)
  } catch (error) {
    // Если запись не найдена, редиректим на страницу курса
    redirect(`/courses/${params.slug}`)
  }

  // Модули уже загружены вместе с курсом
  const modulesWithLessons = course.modules || []

  // Извлекаем playback ID из Mux URL
  const getPlaybackId = (url: string | null) => {
    if (!url) return null
    const muxMatch = url.match(/mux\.com\/([^/?]+)/)
    if (muxMatch) return muxMatch[1]
    return null
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-2">
            {course.title}
          </h1>
          <p className="text-muted-foreground">
            Прогресс: {enrollment.progress}%
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted">
                  {modulesWithLessons && modulesWithLessons[0]?.lessons?.[0]?.video_url ? (
                    (() => {
                      const firstLesson = modulesWithLessons[0].lessons[0]
                      const videoUrl = firstLesson.video_url
                      if (!videoUrl) {
                        return (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-muted-foreground">Выберите урок для просмотра</p>
                          </div>
                        )
                      }
                      const playbackId = getPlaybackId(videoUrl)
                      return playbackId ? (
                        <VideoPlayer
                          playbackId={playbackId}
                          title={firstLesson.title}
                          controls
                          className="w-full h-full"
                        />
                      ) : (
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-muted-foreground">Выберите урок для просмотра</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lessons List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Уроки</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {modulesWithLessons?.map((module) => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{module.title}</span>
                          <Badge variant="outline" className="ml-auto">
                            {module.lessons?.length || 0}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 mt-2">
                          {module.lessons?.map((lesson) => {
                            const playbackId = lesson.video_url ? getPlaybackId(lesson.video_url) : null
                            return (
                              <li key={lesson.id}>
                                <button className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                                  <Play className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm flex-1">{lesson.title}</span>
                                  {lesson.duration && (
                                    <span className="text-xs text-muted-foreground">
                                      {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
