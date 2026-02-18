/**
 * Страница успешной оплаты курса
 */
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { getCourseByIdServer } from '@/features/courses/api'
import { cookies } from 'next/headers'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }> | { courseId?: string }
}) {
  const params = await Promise.resolve(searchParams)
  const courseId = params.courseId

  let courseTitle: string | null = null
  let courseSlug: string | null = null
  if (courseId) {
    try {
      const cookieStore = await cookies()
      const course = await getCourseByIdServer(courseId, cookieStore)
      courseTitle = course.title
      courseSlug = course.slug
    } catch {
      // курс не найден или ошибка — показываем общее сообщение
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">Оплата прошла успешно</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseTitle && (
            <p className="text-center text-muted-foreground">
              Вы записаны на курс &quot;{courseTitle}&quot;.
            </p>
          )}
          {!courseTitle && courseId && (
            <p className="text-center text-muted-foreground">
              Запись на курс оформлена. Зайдите в личный кабинет, чтобы начать обучение.
            </p>
          )}
          {!courseId && (
            <p className="text-center text-muted-foreground">
              Спасибо за оплату. Зайдите в личный кабинет, чтобы увидеть свои курсы.
            </p>
          )}
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/dashboard">
              <Button className="w-full">Перейти в личный кабинет</Button>
            </Link>
            {courseId && (
              <Link href={courseSlug ? `/dashboard/courses/${courseSlug}` : '/dashboard'}>
                <Button variant="outline" className="w-full">
                  Перейти к курсу
                </Button>
              </Link>
            )}
            <Link href="/courses">
              <Button variant="ghost" className="w-full">
                Все курсы
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
