/**
 * Server wrapper для Navigation компонента
 * Получает пользователя на сервере и передает в client Navigation
 */
import { cookies } from 'next/headers'
import { getCurrentUserServer } from '@/lib/api/auth'
import { Navigation } from './Navigation'

interface NavigationWrapperProps {
  onBookClick?: () => void
}

export async function NavigationWrapper({ onBookClick }: NavigationWrapperProps) {
  const cookieStore = await cookies()
  let user = null

  try {
    user = await getCurrentUserServer(cookieStore)
  } catch {
    // Игнорируем ошибки аутентификации - просто показываем незалогиненную навигацию
  }

  return <Navigation onBookClick={onBookClick} user={user} />
}
