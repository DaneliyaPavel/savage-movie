/**
 * Страница курса в dashboard студента
 */
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/api/auth'
import { getCourseBySlugServer } from '@/features/courses/api'
import { getEnrollmentByCourseServer } from '@/lib/api/enrollments'
import { getCourseMaterialsServer } from '@/lib/api/course-materials'
import { DashboardCoursePlayer } from '@/features/courses/components/DashboardCoursePlayer'
import { CourseCover } from '@/features/courses/components/CourseCover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { FileText, ExternalLink } from 'lucide-react'
import type { Course } from '@/features/courses/api'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function DashboardCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const user = await getCurrentUserServer(cookieStore)

  if (!user) {
    redirect('/')
  }

  let course: Course | null = null
  try {
    course = await getCourseBySlugServer(slug, cookieStore)
  } catch (error) {
    console.warn('Ошибка загрузки курса:', error)
  }

  if (!course) {
    notFound()
  }

  let enrollment = null
  try {
    enrollment = await getEnrollmentByCourseServer(course.id, cookieStore)
  } catch {
    redirect(`/courses/${slug}`)
  }

  let materials: Awaited<ReturnType<typeof getCourseMaterialsServer>> = []
  try {
    materials = await getCourseMaterialsServer(course.id, cookieStore)
  } catch {
    // материалы опциональны
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Breadcrumbs
            items={[{ label: 'Личный кабинет', href: '/dashboard' }, { label: course.title }]}
            className="mb-4"
          />
          <BackButton href="/dashboard" className="mb-4" />
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-2">{course.title}</h1>
          <p className="text-muted-foreground">Прогресс: {enrollment.progress}%</p>
        </div>

        <div className="mb-8 overflow-hidden rounded-xl border border-border">
          <CourseCover
            settings={course.card_cover ?? undefined}
            coverImage={course.cover_image}
            coverVideoUrl={course.video_promo_url}
            coverMediaType={course.card_cover?.media_type ?? 'image'}
            format={course.format}
          />
        </div>

        <DashboardCoursePlayer course={course} enrollment={enrollment} />

        {materials.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Материалы курса</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {materials.map(m => (
                  <li key={m.id}>
                    {m.material_type === 'link' && m.external_url ? (
                      <Link
                        href={m.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{m.title}</span>
                      </Link>
                    ) : m.file_url ? (
                      <Link
                        href={m.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{m.title}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-lg border opacity-75">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{m.title}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
