/**
 * Layout для маркетинговых страниц (главная, проекты, курсы и т.д.)
 */
'use client'

import { useState } from 'react'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const handleBookClick = () => {
    setIsBookingOpen(true)
  }

  return (
    <>
      <Navigation onBookClick={handleBookClick} />
      <main className="pt-16 md:pt-20">
        {children}
      </main>
      <Footer />

      {/* Booking Modal */}
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
    </>
  )
}
