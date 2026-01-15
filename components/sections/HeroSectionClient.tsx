/**
 * Клиентская обертка для HeroSection с доступом к контексту
 */
'use client'

import { HeroSection } from './HeroSection'
import { useRouter } from 'next/navigation'

export function HeroSectionClient() {
  const router = useRouter()

  const handleBookClick = () => {
    // Открываем модальное окно через событие или переходим на страницу контактов
    // Можно использовать window.dispatchEvent для связи с layout
    const event = new CustomEvent('openBooking')
    window.dispatchEvent(event)
    
    // Fallback: если событие не обработано, переходим на страницу контактов
    setTimeout(() => {
      router.push('/contact')
    }, 100)
  }

  return <HeroSection onBookClick={handleBookClick} />
}
