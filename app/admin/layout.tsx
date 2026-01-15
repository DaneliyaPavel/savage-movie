/**
 * Layout для админ-панели (требует прав администратора)
 */
import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/api/auth'
import { Navigation } from '@/components/sections/Navigation'
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
      redirect('/')
    }

    // Проверяем, является ли пользователь администратором
    if (user.role !== 'admin') {
      redirect('/')
    }
  } catch {
    redirect('/')
  }

  return (
    <>
      <Navigation />
      <main className="pt-16 md:pt-20">
        {children}
      </main>
    </>
  )
}
