/**
 * Переход между страницами: красная штора с логотипом.
 *
 * Контент новой страницы монтируется сразу и не анимируется — штора только
 * закрывает момент подмены и прыжок скролла. Поэтому её длительность это
 * чистое ожидание для пользователя, и держать её нужно ровно столько, сколько
 * занимает сама подмена: 600 мс вместо прежних 1400.
 *
 * Фаза удержания оставлена символической (18 мс). Отдельная долгая пауза на
 * полном покрытии имела смысл, только если бы под шторой что-то грузилось —
 * здесь Next.js уже отдал страницу.
 */
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'

/**
 * 0 → 282 мс   штора приходит справа и закрывает экран
 * 282 → 300 мс удержание
 * 300 → 600 мс уходит влево, открывая новую страницу
 */
const CURTAIN_DURATION = 0.6
const CURTAIN_TIMES = [0, 0.47, 0.5, 1]

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  /*
   * Штора нужна только на переходах, но не на первой загрузке. Прежняя версия
   * определяла это записью в ref прямо в теле рендера: под StrictMode и при
   * любом повторном рендере флаг «съедался» до коммита, и штора могла сыграть
   * на первом же экране. Здесь — штатный React-приём «правка состояния во
   * время рендера»: React повторяет рендер до коммита, поэтому лишнего кадра
   * с непокрытой новой страницей не появляется.
   */
  const [previousPath, setPreviousPath] = useState(pathname)
  const [hasNavigated, setHasNavigated] = useState(false)

  if (previousPath !== pathname) {
    setPreviousPath(pathname)
    setHasNavigated(true)
  }

  return (
    <>
      <div key={pathname}>{children}</div>
      {hasNavigated && <TransitionCurtain key={`${pathname}-curtain`} />}
    </>
  )
}

function TransitionCurtain() {
  const shouldReduceMotion = useReducedMotion()
  // Отыграв, штора снимается: незачем держать фиксированный полноэкранный слой
  const [isDone, setIsDone] = useState(false)

  if (shouldReduceMotion || isDone) return null

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#FF322E] pointer-events-none flex items-center justify-center overflow-hidden"
      initial={{ x: '100%' }}
      animate={{ x: ['100%', '0%', '0%', '-100%'] }}
      transition={{
        duration: CURTAIN_DURATION,
        times: CURTAIN_TIMES,
        /*
         * Своя кривая на каждый отрезок. На приходе — ease-out: движение
         * начинается сразу, в тот момент, когда на него смотрят. На уходе —
         * симметричная in-out, штора разгоняется прочь и не оставляет
         * красной полосы у левого края.
         */
        ease: [[0.33, 1, 0.68, 1], 'linear', [0.65, 0, 0.35, 1]],
      }}
      onAnimationComplete={() => setIsDone(true)}
      aria-hidden="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.92, 1, 1, 0.92] }}
        transition={{
          duration: CURTAIN_DURATION,
          times: [0, 0.38, 0.6, 1],
          ease: [0.45, 0, 0.55, 1],
        }}
        className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center"
      >
        <Image
          src="/sm-logo.svg"
          alt=""
          width={192}
          height={192}
          className="w-full h-full object-contain invert"
        />
      </motion.div>
    </motion.div>
  )
}
