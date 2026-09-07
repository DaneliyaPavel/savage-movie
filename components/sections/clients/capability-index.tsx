/**
 * «С чем к нам приходят» — не сетка услуг, а указатель по задачам.
 *
 * Каждая строка ведёт в реальный проект, которым эта задача закрыта: обещание
 * проверяется одним кликом. На десктопе наведение и фокус с клавиатуры меняют
 * кадр справа, на мобильных вся информация видна сразу — ничего важного
 * за ховером не спрятано.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useReveal } from './use-reveal'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import type { CapabilityTask } from '@/features/clients/content'

export interface CapabilityEntry {
  task: CapabilityTask
  projects: Array<{ slug: string; title: string; client: string | null; still: string | null }>
}

export function CapabilityIndex({ entries }: { entries: CapabilityEntry[] }) {
  const reduceMotion = useReducedMotion() ?? false
  const [activeId, setActiveId] = useState(entries[0]?.task.id ?? '')
  const listRef = useRef<HTMLUListElement>(null)
  const rootRef = useReveal<HTMLElement>()

  /*
   * Превью следует за чтением, а не только за курсором. Без этого тот, кто
   * просто скроллит, видел рядом с «Beauty и уход» кадр ZARINA: подпись под
   * картинкой противоречила подсвеченной строке, и блок читался как сломанный.
   */
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return

    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-capability-id]'))
    const observer = new IntersectionObserver(
      observed => {
        const visible = observed.find(entry => entry.isIntersecting)
        const id = (visible?.target as HTMLElement | undefined)?.dataset.capabilityId
        if (id) setActiveId(id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )

    rows.forEach(row => observer.observe(row))
    return () => observer.disconnect()
  }, [entries.length])

  if (entries.length === 0) return null

  const active = entries.find(entry => entry.task.id === activeId) ?? entries[0]
  const preview = active?.projects[0] ?? null

  const track = (slug: string, client: string | null) =>
    trackMetrikaGoal('clients_project_click', {
      client: client ?? '',
      project_slug: slug,
      source: 'capability',
    })

  return (
    <section
      ref={rootRef}
      className="border-t border-white/10 px-5 py-20 sm:px-8 md:px-10 md:py-28 lg:px-16"
    >
      <h2
        data-reveal=""
        className="max-w-[20ch] font-brand-hero text-[clamp(1.9rem,6vw,4rem)] uppercase leading-[0.95] tracking-tighter text-white"
      >
        С чем к нам приходят
      </h2>

      <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-10">
        <ul ref={listRef} className="md:col-span-7">
          {entries.map(entry => {
            const isActive = entry.task.id === active?.task.id
            const primary = entry.projects[0]

            return (
              <li
                key={entry.task.id}
                data-capability-id={entry.task.id}
                className="border-t border-white/10 last:border-b"
              >
                <Link
                  href={primary ? `/projects/${primary.slug}` : '/projects'}
                  onMouseEnter={() => setActiveId(entry.task.id)}
                  onFocus={() => setActiveId(entry.task.id)}
                  onClick={() => primary && track(primary.slug, primary.client)}
                  className="group block py-5 transition-[color,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ff2936] active:translate-x-1 motion-reduce:active:translate-x-0 md:py-6"
                >
                  <span
                    className={`block font-brand-hero text-[clamp(1.35rem,3.6vw,2.25rem)] uppercase leading-[1.02] tracking-tight transition-colors duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-white/90 md:text-white/50 md:group-hover:text-white/80'
                    }`}
                  >
                    {entry.task.title}
                  </span>

                  <span className="mt-2 block max-w-[52ch] text-[14px] font-light leading-relaxed text-white/55 md:text-[15px]">
                    {entry.task.summary}
                  </span>

                  {primary && (
                    <span className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/55 transition-colors duration-200 group-hover:text-white md:text-[11px]">
                      {primary.client || primary.title}
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-active:translate-x-1.5"
                      >
                        →
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Превью: подсказка к списку, поэтому вне табуляции и скрыто на мобильных */}
        <div className="hidden md:col-span-5 md:col-start-8 md:block lg:col-span-4 lg:col-start-9">
          <div className="sticky top-28" aria-hidden="true">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/[0.02]">
              <AnimatePresence initial={false}>
                {preview?.still && (
                  <motion.div
                    key={preview.slug}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={preview.still}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 30vw, 40vw"
                      quality={65}
                      className="object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {preview && (
              <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-white/55">
                {preview.client ? `${preview.client} / ` : ''}
                {preview.title}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
