/**
 * Постоянно доступный CTA сметы.
 *
 * Появляется после того, как первый экран уехал вверх: пока hero на месте,
 * его собственная кнопка и так на виду, а второй CTA в тот же момент только
 * шумит. На мобильных — узкая полоса снизу (в форме под неё зарезервирован
 * отступ, поэтому она не перекрывает последние поля), на десктопе —
 * компактная кнопка справа, чтобы не спорить с меню Savage.
 *
 * Собственный header страница не заводит: шапка сайта остаётся общей.
 */
'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface StickyEstimateCtaProps {
  label: string
  onClick: () => void
  /** Скрываем, когда пользователь уже в форме или отправил заявку */
  hidden?: boolean
}

export function StickyEstimateCta({ label, onClick, hidden = false }: StickyEstimateCtaProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const update = () => setIsVisible(window.scrollY > window.innerHeight * 0.8)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (hidden || !isVisible) return null

  return (
    <>
      {/* Мобильная полоса */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-white px-6 py-3.5 text-sm font-medium text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {label}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Десктопная кнопка */}
      <button
        type="button"
        onClick={onClick}
        className="group fixed bottom-8 right-8 z-40 hidden items-center gap-2 rounded-sm bg-white px-6 py-3.5 text-sm font-medium text-black shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:inline-flex"
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </>
  )
}
