/**
 * Работы — «контрольный лист».
 *
 * Восемь кадров из опубликованных проектов, сложенных как лист проб: у каждого
 * номер, бренд, год и тип работы. Кадры — настоящие стиллы проектов (те же, что
 * на /clients), ссылки ведут на кейсы. Нет проекта в портфолио — карточки нет,
 * битых ссылок нет. Колонки едут с разной скоростью (параллакс, от lg, без
 * reduced motion).
 */
'use client'

import { useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'

import type { AboutWork } from '@/lib/about/load'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { cn } from '@/lib/utils'
import { KIT_KICKER, setTitle, typo } from '../direction/direction-kit'
import { useReduced } from './use-reduced'

function Cell({
  work,
  number,
  drift,
  reduced,
  progress,
}: {
  work: AboutWork
  number: number
  drift: number
  reduced: boolean
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const y = useTransform(progress, [0, 1], [drift, -drift])
  return (
    <motion.li
      data-reveal=""
      style={
        {
          '--reveal-delay': `${(number % 4) * 70}ms`,
          ...(reduced ? {} : { y }),
        } as CSSProperties
      }
      className={cn('about-cell', number % 2 === 1 && 'lg:mt-24')}
    >
      <Link
        href={`/projects/${work.slug}`}
        onClick={() =>
          trackMetrikaGoal('service_case_open', { service: 'about', case_slug: work.slug })
        }
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span
          className={cn(
            'about-shot relative block overflow-hidden bg-[#0a0a0a]',
            work.vertical ? 'aspect-[4/5]' : 'aspect-[5/4]'
          )}
        >
          <Image
            src={work.still}
            alt={`Кадр из проекта «${work.title}» для ${work.client}`}
            fill
            quality={65}
            sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
          />
          <span aria-hidden="true" className="about-shot-marks" />
          <span className="dir-kit-meta absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono uppercase tabular-nums text-white">
            A{String(number + 1).padStart(2, '0')}
          </span>
          <span
            aria-hidden="true"
            className="about-shot-open absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black"
          >
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </span>
        <span className="mt-4 flex items-baseline justify-between gap-4">
          <span className="font-stage text-[clamp(1.05rem,1.5vw,1.35rem)] uppercase leading-[1.05] tracking-tight text-white [overflow-wrap:anywhere]">
            {work.client}
          </span>
          <span className="dir-kit-meta shrink-0 font-mono uppercase tabular-nums text-white/55">
            {work.year ?? ''}
          </span>
        </span>
        <span className="dir-kit-meta mt-2 block font-mono uppercase text-white/55">
          {work.category} · «{typo(work.title)}»
        </span>
      </Link>
    </motion.li>
  )
}

export function AboutWorks({ works }: { works: AboutWork[] }) {
  const reduced = useReduced()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  if (works.length === 0) return null

  return (
    <section
      ref={ref}
      id="about-works"
      aria-labelledby="about-works-title"
      className="relative overflow-hidden border-t border-white/10 bg-black px-6 py-20 md:px-10 md:py-32 lg:px-20"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] md:items-end md:gap-12">
        <div>
          <div data-reveal="" className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            06 / Работы
          </div>
          <h2
            id="about-works-title"
            data-reveal=""
            className="mt-6 font-stage text-[clamp(2rem,4.6vw,4.25rem)] uppercase leading-[0.95] tracking-[-0.035em] text-white text-balance [overflow-wrap:anywhere]"
          >
            {setTitle('Что мы снимали')}
          </h2>
        </div>
        <p
          data-reveal=""
          style={{ '--reveal-delay': '80ms' } as CSSProperties}
          className="max-w-[28rem] text-[0.95rem] font-extralight leading-relaxed text-white/70 md:justify-self-end md:text-base"
        >
          {typo('Кадры из проектов портфолио. Каждый ведёт на кейс с описанием задачи и работой.')}
        </p>
      </div>

      <ul className="mt-12 grid grid-cols-1 items-start gap-x-5 gap-y-12 sm:grid-cols-2 md:mt-16 lg:grid-cols-4 lg:gap-x-6">
        {works.map((work, index) => (
          <Cell
            key={work.slug}
            work={work}
            number={index}
            drift={index % 2 === 0 ? 28 : 56}
            reduced={reduced}
            progress={scrollYProgress}
          />
        ))}
      </ul>

      <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/15 pt-8">
        <Link
          href="/projects"
          className="dir-kit-meta inline-flex items-center gap-2 font-mono uppercase text-white underline decoration-white/40 underline-offset-8 transition-colors hover:decoration-accent focus-visible:decoration-accent"
        >
          Все проекты <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-accent" />
        </Link>
        <Link
          href="/clients"
          className="dir-kit-meta inline-flex items-center gap-2 font-mono uppercase text-white underline decoration-white/40 underline-offset-8 transition-colors hover:decoration-accent focus-visible:decoration-accent"
        >
          Клиенты <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-accent" />
        </Link>
      </div>
    </section>
  )
}
