/**
 * Кнопка для записи на курс с обработкой платежа
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CourseEnrollmentButtonProps {
  courseId: string
  courseTitle: string
  price: number
}

export function CourseEnrollmentButton({
  courseId,
  courseTitle,
  price,
}: CourseEnrollmentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEnroll = async () => {
    setIsLoading(true)
    try {
      // Создаем платеж
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          courseTitle,
          amount: price,
        }),
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Ошибка создания платежа')
      }

      const { paymentUrl } = await response.json()
      
      // Перенаправляем на страницу оплаты
      window.location.href = paymentUrl
    } catch (error) {
      console.error('Ошибка записи на курс:', error)
      setIsLoading(false)
      // Здесь можно добавить toast уведомление
    }
  }

  return (
    <Button
      size="lg"
      className="w-full md:w-auto text-lg px-8 py-6"
      onClick={handleEnroll}
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
          Записаться на курс
        </>
      )}
    </Button>
  )
}
