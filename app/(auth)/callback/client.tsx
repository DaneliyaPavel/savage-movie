/**
 * Клиентский компонент для обработки OAuth токенов
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthCallbackClientProps {
  searchParams: Promise<{ access_token?: string; refresh_token?: string }>
}

export function AuthCallbackClient({ searchParams }: AuthCallbackClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    searchParams.then((params) => {
      if (params.access_token && params.refresh_token) {
        // Сохраняем токены
        localStorage.setItem('access_token', params.access_token)
        localStorage.setItem('refresh_token', params.refresh_token)

        // Редиректим в dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        // Если токены не получены, редиректим на главную
        router.push('/')
      }
      setIsLoading(false)
    })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">
          {isLoading ? 'Завершение входа...' : 'Перенаправление...'}
        </p>
      </div>
    </div>
  )
}
