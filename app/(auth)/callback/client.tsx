/**
 * Клиентский компонент для обработки OAuth callback.
 * Токены теперь приходят через HttpOnly cookies (установлены backend),
 * а не через URL query params.
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthCallbackClientProps {
  searchParams: Promise<{ provider?: string }>
}

export function AuthCallbackClient({ searchParams }: AuthCallbackClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    searchParams.then(async params => {
      if (params.provider) {
        // Токены уже в HttpOnly cookies — просто редиректим в dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
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
