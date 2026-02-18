'use client'

import { useMemo, useState, useCallback } from 'react'
import { VideoPlayer } from '@/features/projects/components/VideoPlayer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Play, Loader2 } from 'lucide-react'
import { updateEnrollmentProgress } from '@/lib/api/enrollments'
import type { Course, CourseModule, Lesson } from '@/features/courses/api'

function getPlaybackId(url: string | null): string | null {
  if (!url) return null
  const muxMatch = url.match(/mux\.com\/([^/?]+)/)
  return muxMatch?.[1] ?? null
}

function flattenLessons(modules: CourseModule[]): { lesson: Lesson; moduleTitle: string }[] {
  const result: { lesson: Lesson; moduleTitle: string }[] = []
  const sorted = [...modules].sort((a, b) => a.order - b.order)
  for (const mod of sorted) {
    const lessons = [...(mod.lessons || [])].sort((a, b) => a.order - b.order)
    for (const lesson of lessons) {
      result.push({ lesson, moduleTitle: mod.title })
    }
  }
  return result
}

interface DashboardCoursePlayerProps {
  course: Course
  enrollment: { id: string; progress: number }
}

export function DashboardCoursePlayer({ course, enrollment }: DashboardCoursePlayerProps) {
  const flatLessons = useMemo(() => flattenLessons(course.modules || []), [course.modules])
  const firstLessonId = flatLessons[0]?.lesson.id ?? null
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(firstLessonId)
  const [updatingProgress, setUpdatingProgress] = useState(false)

  const selectedEntry = useMemo(
    () => flatLessons.find(e => e.lesson.id === selectedLessonId),
    [flatLessons, selectedLessonId]
  )
  const selectedIndex = useMemo(
    () => flatLessons.findIndex(e => e.lesson.id === selectedLessonId),
    [flatLessons, selectedLessonId]
  )

  const handleMarkComplete = useCallback(async () => {
    if (selectedIndex < 0 || flatLessons.length === 0) return
    const newProgress = Math.min(
      100,
      Math.round(((selectedIndex + 1) / flatLessons.length) * 100)
    )
    setUpdatingProgress(true)
    try {
      await updateEnrollmentProgress(enrollment.id, newProgress)
      // Можно обновить страницу или локальное состояние — для простоты оставляем как есть
    } catch (e) {
      console.error('Ошибка обновления прогресса:', e)
    } finally {
      setUpdatingProgress(false)
    }
  }, [enrollment.id, selectedIndex, flatLessons.length])

  const currentLesson = selectedEntry?.lesson
  const videoUrl = currentLesson?.video_url ?? null
  const playbackId = videoUrl ? getPlaybackId(videoUrl) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <div className="aspect-video bg-muted">
              {currentLesson && playbackId ? (
                <VideoPlayer
                  playbackId={playbackId}
                  title={currentLesson.title}
                  controls
                  className="w-full h-full"
                />
              ) : currentLesson && videoUrl ? (
                <video src={videoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {flatLessons.length === 0
                      ? 'В этом курсе пока нет уроков'
                      : 'Выберите урок для просмотра'}
                  </p>
                </div>
              )}
            </div>
            {currentLesson && flatLessons.length > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkComplete}
                  disabled={updatingProgress}
                >
                  {updatingProgress ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Отметить просмотренным
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Уроки</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {(course.modules || []).map(module => (
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
                      {(module.lessons || []).map(lesson => (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedLessonId(lesson.id)}
                            className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              selectedLessonId === lesson.id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm flex-1">{lesson.title}</span>
                            {lesson.duration != null && (
                              <span className="text-xs text-muted-foreground">
                                {lesson.duration} мин
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
