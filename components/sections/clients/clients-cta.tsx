/**
 * Финальный экран.
 *
 * Номер продолжает нумерацию ролла выше: следующая строка в титрах — клиентская.
 * Новой формы здесь нет сознательно — /booking уже собирает заявку и ведёт её
 * в тот же /api/contact, вторая точка входа только размыла бы аналитику.
 */
'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'

export function ClientsCta({ nextIndex }: { nextIndex: number }) {
  const reduceMotion = useReducedMotion() ?? false

  return (
    <section className="border-t border-white/10 px-5 py-24 sm:px-8 md:px-10 md:py-36 lg:px-16">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <span
          className="block text-xl text-[#ff2936] md:text-2xl"
          style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          aria-hidden="true"
        >
          # {String(nextIndex).padStart(2, '0')}
        </span>

        <h2 className="mt-4 max-w-[14ch] pb-2 font-brand-hero text-[clamp(2.5rem,9vw,8rem)] uppercase leading-[0.92] tracking-tighter text-white">
          Следующая строка ваша
        </h2>

        <div className="mt-12 flex flex-col gap-8 border-t border-white/10 pt-8 md:mt-16 md:flex-row md:items-start md:justify-between md:gap-16">
          <p className="max-w-[46ch] text-[15px] font-light leading-relaxed text-white/65 md:text-base">
            Созвон бесплатный, 15–20 минут. Обсудим задачу, формат, примерный бюджет и сроки. После
            него будет понятно, берёмся ли мы за проект. Если задача не наша, скажем честно.
          </p>

          <Link
            href="/booking"
            onClick={() => trackMetrikaGoal('booking_click', { source: 'clients_final' })}
            className="group inline-flex w-full shrink-0 items-center justify-between gap-8 bg-white px-6 py-5 text-[11px] uppercase tracking-[0.24em] text-black transition-[background-color,color,transform] duration-200 ease-out hover:bg-black hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff2936] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto md:text-xs"
          >
            Обсудить проект
            <span
              aria-hidden="true"
              className="transition-transform duration-300 ease-out group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
