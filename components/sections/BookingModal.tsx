/**
 * BookingModal - модальное окно для бронирования консультации
 */
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function BookingModal() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  // Слушаем событие для открытия модального окна из HeroSection
  useEffect(() => {
    const handleOpenBooking = () => {
      setIsBookingOpen(true)
    }
    
    window.addEventListener('openBooking', handleOpenBooking)
    return () => window.removeEventListener('openBooking', handleOpenBooking)
  }, [])

  return (
    <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <iframe
          src={process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com'}
          width="100%"
          height="700"
          frameBorder="0"
          title="Бронирование консультации"
        />
      </DialogContent>
    </Dialog>
  )
}
