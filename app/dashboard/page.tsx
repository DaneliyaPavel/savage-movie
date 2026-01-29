/**
 * Dashboard студента
 */
import { getCurrentUserServer } from '@/lib/api/auth'
import { getEnrollmentsServer } from '@/lib/api/enrollments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'
import { Play, Award } from 'lucide-react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  // Проверяем аутентификацию
  const cookieStore = await cookies()
  const user = await getCurrentUserServer(cookieStore)

  if (!user) {
    redirect('/')
  }

  // Загружаем записи на курсы
  let enrollments: Array<{
    id: string
    course_id: string
    progress: number
    courseTitle?: string
    courseSlug?: string
  }> = []

  try {
    const enrollmentsData = await getEnrollmentsServer(cookieStore)
    enrollments = enrollmentsData.map(enrollment => ({
      ...enrollment,
      courseTitle: 'Загрузка...',
      courseSlug: '',
    }))
  } catch (error) {
    console.warn('Ошибка загрузки записей на курсы:', error)
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Личный кабинет' }]} className="mb-4" />
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-2">Личный кабинет</h1>
          <p className="text-muted-foreground">Добро пожаловать, {user.email}</p>
        </div>

        {/* Enrolled Courses */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl mb-6">Мои курсы</h2>
          {enrollments && enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map(enrollment => {
                // TODO: API должен возвращать полную информацию о курсе вместе с enrollment
                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">
                        {enrollment.courseTitle || `Курс #${enrollment.course_id.slice(0, 8)}`}
                      </CardTitle>
                      <CardDescription>Прогресс: {enrollment.progress}%</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={enrollment.progress} className="mb-4" />
                      <Link
                        href={
                          enrollment.courseSlug
                            ? `/dashboard/courses/${enrollment.courseSlug}`
                            : '#'
                        }
                      >
                        <Button className="w-full" disabled={!enrollment.courseSlug}>
                          <Play className="mr-2 w-4 h-4" />
                          Продолжить обучение
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Вы еще не записались ни на один курс</p>
                <Link href="/courses">
                  <Button>Посмотреть курсы</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
