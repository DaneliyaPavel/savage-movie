/**
 * Форма записи на курс: имя, email, телефон → переход к оплате (ЮKassa).
 * Для авторизованных пользователей показывается кнопка без формы (данные из сессии).
 */
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, ShoppingCart } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import type { User } from '@/lib/api/auth'

const enrollmentFormSchema = z.object({
  name: z.string().min(1, 'Укажите имя'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(1, 'Укажите телефон'),
  consent: z.literal(true, { error: 'Необходимо дать согласие на обработку персональных данных' }),
})

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>

interface CourseEnrollmentFormProps {
  courseId: string
  courseTitle: string
  price: number
  /** Если передан — пользователь авторизован, форма не показывается, при оплате данные берутся из сессии */
  initialUser?: User | null
}

export function CourseEnrollmentForm({
  courseId,
  courseTitle,
  price,
  initialUser,
}: CourseEnrollmentFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authConsent, setAuthConsent] = useState(false)

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      name: initialUser?.full_name ?? '',
      email: initialUser?.email ?? '',
      phone: '',
      consent: false as unknown as true,
    },
  })

  const onSubmit = async (values: EnrollmentFormValues) => {
    setSubmitError(null)
    setIsLoading(true)
    try {
      const body: Record<string, unknown> = {
        courseId,
        courseTitle,
        amount: price,
      }
      if (!initialUser) {
        body.guest = { name: values.name, email: values.email, phone: values.phone }
      }

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json().catch(() => ({}))
      const errorMessage = data?.error ?? 'Ошибка создания платежа'

      if (response.status === 401) {
        setSubmitError('Требуется авторизация или заполнение формы')
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        setSubmitError(errorMessage)
        setIsLoading(false)
        return
      }

      const paymentUrl = data.paymentUrl
      if (!paymentUrl || typeof paymentUrl !== 'string') {
        setSubmitError('Не удалось получить ссылку на оплату')
        setIsLoading(false)
        return
      }

      let parsedUrl: URL
      try {
        parsedUrl = new URL(paymentUrl, window.location.origin)
      } catch {
        setSubmitError('Некорректная ссылка на оплату')
        setIsLoading(false)
        return
      }

      const allowedHosts = ['yoomoney.ru', 'yookassa.ru']
      const isSameOrigin = parsedUrl.origin === window.location.origin
      const isAllowedHost = allowedHosts.some(
        host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
      )
      if (!isSameOrigin && !isAllowedHost) {
        setSubmitError('Недопустимая ссылка на оплату')
        setIsLoading(false)
        return
      }
      if (!isSameOrigin && parsedUrl.protocol !== 'https:') {
        setSubmitError('Ссылка на оплату должна использовать HTTPS')
        setIsLoading(false)
        return
      }

      window.location.href = parsedUrl.toString()
    } catch (error) {
      console.error('Ошибка записи на курс:', error)
      setSubmitError('Ошибка соединения. Попробуйте позже.')
      setIsLoading(false)
    }
  }

  const handleAuthUserSubmit = async () => {
    setSubmitError(null)
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, courseTitle, amount: price }),
      })

      const data = await response.json().catch(() => ({}))
      if (response.status === 401) {
        setSubmitError('Требуется авторизация')
        setIsLoading(false)
        return
      }
      if (!response.ok) {
        setSubmitError(data?.error ?? 'Ошибка создания платежа')
        setIsLoading(false)
        return
      }
      const paymentUrl = data.paymentUrl
      if (!paymentUrl || typeof paymentUrl !== 'string') {
        setSubmitError('Не удалось получить ссылку на оплату')
        setIsLoading(false)
        return
      }
      const parsedUrl = new URL(paymentUrl, window.location.origin)
      const allowedHosts = ['yoomoney.ru', 'yookassa.ru']
      const ok =
        parsedUrl.origin === window.location.origin ||
        allowedHosts.some(
          h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`)
        )
      if (!ok || (!parsedUrl.origin.startsWith(window.location.origin) && parsedUrl.protocol !== 'https:')) {
        setSubmitError('Недопустимая ссылка на оплату')
        setIsLoading(false)
        return
      }
      window.location.href = parsedUrl.toString()
    } catch (error) {
      console.error('Ошибка записи на курс:', error)
      setSubmitError('Ошибка соединения. Попробуйте позже.')
      setIsLoading(false)
    }
  }

  if (initialUser) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Записаться на курс</CardTitle>
          <p className="text-sm text-muted-foreground">
            Вы вошли как {initialUser.email}. Нажмите кнопку ниже, чтобы перейти к оплате.
          </p>
        </CardHeader>
        <CardContent>
          {submitError && (
            <p className="text-destructive text-sm mb-4" role="alert">
              {submitError}
            </p>
          )}
          <div className="flex items-start space-x-3 mb-4">
            <Checkbox
              id="auth-consent"
              checked={authConsent}
              onCheckedChange={(checked) => setAuthConsent(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="auth-consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Даю{' '}
              <Link href="/consent" className="underline hover:text-foreground transition-colors">
                согласие на обработку персональных данных
              </Link>{' '}
              в соответствии с{' '}
              <Link href="/privacy" className="underline hover:text-foreground transition-colors">
                Политикой обработки ПД
              </Link>
            </label>
          </div>
          <Button
            size="lg"
            className="w-full text-lg px-8 py-6"
            onClick={handleAuthUserSubmit}
            disabled={isLoading || !authConsent}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Перейти к оплате
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Записаться на курс</CardTitle>
        <p className="text-sm text-muted-foreground">
          Заполните форму и перейдите к оплате. После успешной оплаты вы получите письмо с доступом.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {submitError && (
              <p className="text-destructive text-sm" role="alert">
                {submitError}
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Иванов" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ivan@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+7 (999) 123-45-67" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                      Даю{' '}
                      <Link href="/consent" className="underline hover:text-foreground transition-colors">
                        согласие на обработку персональных данных
                      </Link>{' '}
                      в соответствии с{' '}
                      <Link href="/privacy" className="underline hover:text-foreground transition-colors">
                        Политикой обработки ПД
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg px-8 py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Перейти к оплате
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
