/**
 * Клиентская часть маркетингового layout с анимациями
 */
'use client'

import { Footer } from '@/components/sections/Footer'
import { BookingModal } from '@/components/sections/BookingModal'
import { Preloader } from '@/components/ui/preloader'
import { PageTransitions } from '@/components/providers/page-transitions'
import { useState } from 'react'

interface MarketingLayoutClientProps {
  children: React.ReactNode
  navigation: React.ReactNode
}

export function MarketingLayoutClient({ children, navigation }: MarketingLayoutClientProps) {
  const [showContent, setShowContent] = useState(false)

  return (
    <>
      <Preloader onComplete={() => setShowContent(true)} />
      {showContent && (
        <>
          {navigation}
          <PageTransitions>
            <main className="pt-16 md:pt-20 bg-[#000000] min-h-screen">
              {children}
            </main>
          </PageTransitions>
          <Footer />
          <BookingModal />
        </>
      )}
    </>
  )
}
