/**
 * Layout для админ-панели (требует прав администратора)
 */
import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/api/auth'
import { NavigationWrapper } from '@/components/sections/NavigationWrapper'
import { cookies } from 'next/headers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Проверяем аутентификацию и права администратора
  const cookieStore = await cookies()
  
  try {
    const user = await getCurrentUserServer(cookieStore)
    
    if (!user) {
      // Перенаправляем на страницу логина вместо главной
      redirect('/login?redirect=/admin')
    }

    // Проверяем, является ли пользователь администратором
    if (user.role !== 'admin') {
      redirect('/login?redirect=/admin&error=insufficient_permissions')
    }
  } catch (error) {
    // Логируем ошибку для отладки
    console.error('Ошибка проверки аутентификации в админ-панели:', error)
    redirect('/login?redirect=/admin&error=auth_failed')
  }

  return (
    <>
      <NavigationWrapper />
      <main className="pt-16 md:pt-20">
        {children}
      </main>
    </>
  )
}
