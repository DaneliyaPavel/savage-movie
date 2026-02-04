'use client'

import { I18nProvider } from '@/lib/i18n-context'
import { MenuProvider } from '@/components/ui/menu-context'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import { PageTransition } from '@/components/ui/page-transition'
import { usePathname } from 'next/navigation'

export function MarketingLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideGrain = pathname?.startsWith('/projects/') && pathname !== '/projects'

  return (
    <I18nProvider>
      <MenuProvider>
        <PageTransition>
          {children}
        </PageTransition>
        {!hideGrain && <GrainOverlay />}
      </MenuProvider>
    </I18nProvider>
  )
}
