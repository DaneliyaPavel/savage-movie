/**
 * Цифры студии и лента брендов.
 *
 * «50+ брендов» и «100+ проектов» — слова владельца (lib/about/content.ts),
 * число направлений считается по lib/services/directions.ts. Лента брендов —
 * опубликованные клиенты портфолио (та же сборка, что у /clients).
 *
 * Счётчик: сервер отдаёт итоговое число, поэтому без JS и для поиска оно
 * настоящее. После гидратации, если блок ещё ниже экрана, число обнуляется и
 * считается заново при входе в кадр. Лента брендов — декор (aria-hidden), её
 * анимация стоит на паузе вне экрана и отключена при prefers-reduced-motion.
 */
'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { ABOUT_NUMBERS } from '@/lib/about/content'
import { pluralRu } from '@/features/clients/mappers'
import type { AboutNumbers } from '@/lib/about/load'
import { KIT_KICKER } from '../direction/direction-kit'
import { reducedNow } from './use-reduced'

const COUNT_MS = 1100
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

function CountUp({ value, plus = false }: { value: number; plus?: boolean }) {
  const suffix = plus ? '+' : ''
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || reducedNow() || typeof IntersectionObserver === 'undefined') return
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) return

    node.textContent = `0${suffix}`
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / COUNT_MS)
          node.textContent = `${Math.round(value * easeOut(t))}${suffix}`
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { rootMargin: '0px 0px -15% 0px' }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      node.textContent = `${value}${suffix}`
    }
  }, [value, suffix])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  )
}

function Marquee({ brands }: { brands: string[] }) {
  const ref = useRef<HTMLDivElement>(null)

  // Бесконечный цикл вне экрана стоит
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      node.dataset.paused = String(entry ? !entry.isIntersecting : false)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const row = (
    <>
      {brands.map(brand => (
        <span key={brand} className="about-marquee-item">
          {brand}
          <span className="about-marquee-sep" />
        </span>
      ))}
    </>
  )

  return (
    <div ref={ref} aria-hidden="true" className="about-marquee">
      <div className="about-marquee-track">
        <div className="about-marquee-row">{row}</div>
        <div className="about-marquee-row">{row}</div>
      </div>
    </div>
  )
}

export function AboutNumbers({ numbers, brands }: { numbers: AboutNumbers; brands: string[] }) {
  const { directions } = numbers
  const { brands: brandsStat, projects: projectsStat } = ABOUT_NUMBERS
  const cells = [
    {
      value: brandsStat.value,
      plus: brandsStat.plus,
      unit: pluralRu(brandsStat.value, ...brandsStat.unit),
    },
    {
      value: projectsStat.value,
      plus: projectsStat.plus,
      unit: pluralRu(projectsStat.value, ...projectsStat.unit),
    },
    {
      value: directions,
      plus: false,
      unit: pluralRu(directions, ...ABOUT_NUMBERS.directions.unit),
    },
  ]

  return (
    <section
      id="about-numbers"
      aria-labelledby="about-numbers-title"
      className="relative border-t border-white/10 bg-black pt-16 md:pt-24"
    >
      <div className="px-6 md:px-10 lg:px-20">
        <div data-reveal="" className={KIT_KICKER}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          02 / Студия в цифрах
        </div>

        <h2 id="about-numbers-title" className="sr-only">
          Студия в цифрах: бренды, проекты и направления
        </h2>

        <dl className="mt-10 grid grid-cols-1 border-t border-white/15 sm:grid-cols-3 md:mt-14">
          {cells.map((cell, index) => (
            <div
              key={cell.unit}
              data-reveal=""
              style={{ '--reveal-delay': `${index * 90}ms` } as CSSProperties}
              className="border-b border-white/15 py-8 sm:border-b-0 sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0 md:py-12"
            >
              <dd className="font-stage text-[clamp(4.5rem,11vw,10rem)] leading-[0.85] tracking-[-0.04em] text-white">
                <CountUp value={cell.value} plus={cell.plus} />
              </dd>
              <dt className="dir-kit-meta mt-5 font-mono uppercase text-white/70">{cell.unit}</dt>
            </div>
          ))}
        </dl>
      </div>

      {brands.length > 0 ? <Marquee brands={brands} /> : <div className="h-16 md:h-24" />}
    </section>
  )
}
