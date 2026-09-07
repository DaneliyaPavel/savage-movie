/**
 * Оболочка /clients: шапка, меню и «жалюзи»-подвал — та же механика, что на
 * /projects, чтобы страница ощущалась частью сайта, а не отдельным лендингом.
 *
 * Контент приходит через children и остаётся серверным: клиентским здесь должен
 * быть только хром страницы.
 */
'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { ProjectsJalousieFooter } from '@/components/sections/ProjectsJalousieFooter'
import { useMenu } from '@/components/ui/menu-context'

export function ClientsPageShell({ children }: { children: ReactNode }) {
  const { setHeaderDark } = useMenu()
  const curtainRef = useRef<HTMLDivElement>(null)

  /*
   * Когда красный подвал открывается из-под контента, белый логотип на нём
   * не читается. Отслеживаем это IntersectionObserver'ом, а не слушателем
   * scroll: обработчик на каждый кадр прокрутки — лишняя работа на странице,
   * которую целиком проходят скроллом.
   */
  useEffect(() => {
    const curtain = curtainRef.current
    if (!curtain) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setHeaderDark(!entry.isIntersecting && entry.boundingClientRect.bottom < 80)
      },
      { rootMargin: '-80px 0px 0px 0px', threshold: 0 }
    )

    observer.observe(curtain)
    return () => {
      observer.disconnect()
      setHeaderDark(false)
    }
  }, [setHeaderDark])

  return (
    <main className="min-h-screen bg-[#000000]">
      <TopBar />
      <JalousieMenu />

      {/* Шторка: лежит выше зафиксированного подвала и открывает его при прокрутке */}
      <div ref={curtainRef} className="relative z-20 bg-[#000000]">
        {children}
      </div>

      <div className="min-h-screen" aria-hidden="true" />

      <ProjectsJalousieFooter />
    </main>
  )
}
