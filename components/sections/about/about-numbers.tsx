/**
 * Цифры студии и лента брендов.
 *
 * Числа не вписаны в вёрстку: брендов и проектов считает сервер по
 * опубликованным проектам (та же сборка, что у /clients), направления — по
 * lib/services/directions.ts. Нет портфолио — блок не рендерится, придуманных
 * чисел «на всякий случай» нет.
 *
 * Счётчик: сервер отдаёт итоговое число, поэтому без JS и для поиска оно
 * настоящее. После гидратации, если блок ещё ниже экрана, число обнуляется и
 * считается заново при входе в кадр. Лента брендов — декор (aria-hidden), её
 * анимация стоит на паузе вне экрана и отключена при prefers-reduced-motion.
 */
'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { ABOUT_NUMBERS_LABELS } from '@/lib/about/content'
import { pluralRu } from '@/features/clients/mappers'
import type { AboutNumbers } from '@/lib/about/load'
import { KIT_KICKER, typo } from '../direction/direction-kit'
import { reducedNow } from './use-reduced'

const COUNT_MS = 1100
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || reducedNow() || typeof IntersectionObserver === 'undefined') return
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) return

    node.textContent = '0'
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / COUNT_MS)
          node.textContent = String(Math.round(value * easeOut(t)))
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
      node.textContent = String(value)
    }
  }, [value])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
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
  const { brands: brandCount, projects, directions, years } = numbers
  const cells = [
    { value: brandCount, unit: pluralRu(brandCount, ...ABOUT_NUMBERS_LABELS.brands) },
    { value: projects, unit: pluralRu(projects, ...ABOUT_NUMBERS_LABELS.projects) },
    { value: directions, unit: pluralRu(directions, ...ABOUT_NUMBERS_LABELS.directions) },
  ]

  return (
    <section
      id="about-numbers"
      aria-labelledby="about-numbers-title"
      className="relative border-t border-white/10 bg-black pt-16 md:pt-24"
    >
      <div className="px-6 md:px-10 lg:px-20">
        <div data-reveal="" className={`${KIT_KICKER} flex-wrap justify-between gap-y-2`}>
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            02 / Студия в цифрах
          </span>
          {years ? (
            <span>
              Портфолио {years[0]}
              {years[0] === years[1] ? '' : `–${years[1]}`}
            </span>
          ) : null}
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
                <CountUp value={cell.value} />
              </dd>
              <dt className="dir-kit-meta mt-5 font-mono uppercase text-white/70">{cell.unit}</dt>
            </div>
          ))}
        </dl>

        <p className="mt-6 max-w-[34rem] text-sm font-extralight leading-relaxed text-white/60">
          {typo(ABOUT_NUMBERS_LABELS.note)}
        </p>
      </div>

      {brands.length > 0 ? <Marquee brands={brands} /> : <div className="h-16 md:h-24" />}
    </section>
  )
}
