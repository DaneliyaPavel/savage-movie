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

import { cn } from '@/lib/utils'

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

  // hidden (форма/футер/после успешной отправки) остаётся жёстким размонтированием —
  // это разовое, направленное подавление, а не то самое «появление по скроллу»,
  // которое не должно дёргаться туда-обратно. isVisible, наоборот, переключается
  // при каждом пересечении порога скролла, поэтому именно его прячем плавно,
  // а не жёстким unmount — иначе кнопка буквально хлопает по экрану.
  if (hidden) return null

  // motion-reduce гасит translate: у reduced-motion пользователя остаётся
  // только opacity-переход (MotionConfig на этот CSS-переход не действует —
  // он управляет только motion.*-компонентами, а не обычными transition).
  const visibility = cn(
    'motion-reduce:translate-y-0',
    isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
  )

  return (
    <>
      {/* Мобильная полоса */}
      <div
        aria-hidden={!isVisible}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur transition-[opacity,translate] duration-200 ease-out md:hidden',
          visibility
        )}
      >
        <button
          type="button"
          tabIndex={isVisible ? 0 : -1}
          onClick={onClick}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-white px-6 py-3.5 text-sm font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {label}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Десктопная кнопка */}
      <button
        type="button"
        tabIndex={isVisible ? 0 : -1}
        aria-hidden={!isVisible}
        onClick={onClick}
        className={cn(
          'group fixed bottom-8 right-8 z-40 hidden items-center gap-2 rounded-sm bg-white px-6 py-3.5 text-sm font-medium text-black shadow-lg transition-[opacity,translate,scale] duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:inline-flex',
          visibility
        )}
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </>
  )
}
