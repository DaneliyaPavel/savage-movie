/**
 * Кнопки для OAuth аутентификации
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { getGoogleOAuthUrl, getYandexOAuthUrl } from '@/lib/api/auth'

export function OAuthButtons() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)
  const [isLoadingYandex, setIsLoadingYandex] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true)
    try {
      const authUrl = await getGoogleOAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error('Ошибка OAuth Google:', error)
      setIsLoadingGoogle(false)
    }
  }

  const handleYandexLogin = async () => {
    setIsLoadingYandex(true)
    try {
      const authUrl = await getYandexOAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error('Ошибка OAuth Yandex:', error)
      setIsLoadingYandex(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoadingGoogle || isLoadingYandex}
      >
        {isLoadingGoogle ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Войти через Google
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleYandexLogin}
        disabled={isLoadingGoogle || isLoadingYandex}
      >
        {isLoadingYandex ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 0-.315.06-.442.18l-1.443 1.443c-.12.127-.18.273-.18.442v5.57c0 .169.06.315.18.442l1.443 1.443c.127.12.273.18.442.18h1.443c.169 0 .315-.06.442-.18l1.443-1.443c.12-.127.18-.273.18-.442V8.16c0-.169-.06-.315-.18-.442L19.453 6.275c-.127-.12-.273-.18-.442-.18h-1.443zm-5.568 0c-.169 0-.315.06-.442.18L9.115 9.783c-.12.127-.18.273-.18.442v5.57c0 .169.06.315.18.442l1.443 1.443c.127.12.273.18.442.18h1.443c.169 0 .315-.06.442-.18l1.443-1.443c.12-.127.18-.273.18-.442v-5.57c0-.169-.06-.315-.18-.442L13.453 6.275c-.127-.12-.273-.18-.442-.18H11.568zM6 8.16c-.169 0-.315.06-.442.18L4.115 9.783c-.12.127-.18.273-.18.442v5.57c0 .169.06.315.18.442l1.443 1.443c.127.12.273.18.442.18H6.443c.169 0 .315-.06.442-.18L8.328 15.197c.12-.127.18-.273.18-.442v-5.57c0-.169-.06-.315-.18-.442L6.885 7.34c-.127-.12-.273-.18-.442-.18H6z" />
            </svg>
            Войти через Yandex
          </>
        )}
      </Button>
    </div>
  )
}
