/**
 * Layout для админ-панели (требует прав администратора)
 */
import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/api/auth'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { cookies } from 'next/headers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Проверяем аутентификацию и права администратора
  const cookieStore = await cookies()

  // Важно: `redirect()` в Next.js реализован через throw.
  // Поэтому нельзя оборачивать его в try/catch — иначе мы "поймаем" редирект
  // и подменим причину (что и приводило к `error=auth_failed` на странице логина).
  const user = await getCurrentUserServer(cookieStore)

  if (!user) {
    // Перенаправляем на страницу логина вместо главной
    redirect('/login?redirect=/admin')
  }

  // Проверяем, является ли пользователь администратором
  if (user.role !== 'admin') {
    redirect('/?error=insufficient_permissions')
  }

  return (
    <>
      <AdminHeader />
      <main className="py-6 md:py-8">
        {children}
      </main>
    </>
  )
}
