/**
 * Страница входа
 */
'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { login } from '@/lib/api/auth'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Показываем сообщение об ошибке, если есть
    const errorParam = searchParams.get('error')
    if (errorParam === 'auth_failed') {
      setError('Требуется авторизация для доступа к админ-панели')
    } else if (errorParam === 'insufficient_permissions') {
      setError('У вас нет прав администратора')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login({ email, password })
      
      // Проверяем, что токены сохранены
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem('access_token')
        if (!savedToken) {
          throw new Error('Токен не был сохранен. Попробуйте снова.')
        }
      }
      
      // Проверяем, есть ли redirect параметр
      const redirectTo = searchParams.get('redirect') || '/admin'
      
      // Используем window.location для полного перезапуска страницы
      window.location.href = redirectTo
    } catch (err: unknown) {
      // Извлекаем сообщение об ошибке из ответа API
      let errorMessage = 'Ошибка входа'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (typeof err === 'object' && err) {
        const anyErr = err as { response?: { data?: { detail?: string } }; data?: { detail?: string }; message?: string }
        if (anyErr.response?.data?.detail) {
          errorMessage = anyErr.response.data.detail
        } else if (anyErr.data?.detail) {
          errorMessage = anyErr.data.detail
        } else if (anyErr.message) {
          errorMessage = anyErr.message
        }
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Вход</CardTitle>
          <CardDescription>
            Войдите в свой аккаунт для доступа к курсам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Или войдите через
                </span>
              </div>
            </div>
            <div className="mt-4">
              <OAuthButtons />
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Нет аккаунта? </span>
            <Link href="/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Вход</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 rounded-md bg-muted animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}
