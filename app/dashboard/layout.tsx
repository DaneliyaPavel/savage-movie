/**
 * Layout для dashboard (требует аутентификации)
 */
import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/api/auth'
import { Navigation } from '@/components/sections/Navigation'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Проверяем аутентификацию через API
  const cookieStore = await cookies()
  
  // Проверяем, что пользователь существует
  try {
    const user = await getCurrentUserServer(cookieStore)
    if (!user) {
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
