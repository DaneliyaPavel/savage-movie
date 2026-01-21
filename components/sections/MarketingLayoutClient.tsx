/**
 * Клиентская часть маркетингового layout с анимациями
 */
'use client'

import { Footer } from '@/components/sections/Footer'
import { BookingModal } from '@/components/sections/BookingModal'
import { Preloader } from '@/components/ui/preloader'
import { PageTransitions } from '@/components/providers/page-transitions'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface MarketingLayoutClientProps {
  children: React.ReactNode
  navigation: React.ReactNode
}

export function MarketingLayoutClient({ children, navigation }: MarketingLayoutClientProps) {
  const [showContent, setShowContent] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <>
      <Preloader onComplete={() => setShowContent(true)} />
      {showContent && (
        <>
          {navigation}
          <PageTransitions>
            {/* Home page - fullscreen, no padding. Other pages - standard layout */}
            <main className={isHomePage ? "bg-[#000000] min-h-screen" : "pt-16 md:pt-20 bg-[#000000] min-h-screen"}>
              {children}
            </main>
          </PageTransitions>
          {/* Footer only on non-home pages, or make it optional */}
          {!isHomePage && <Footer />}
          <BookingModal />
        </>
      )}
    </>
  )
}
