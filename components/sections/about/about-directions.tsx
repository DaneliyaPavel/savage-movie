/**
 * Направления студии — индекс из семи строк-«кадров».
 *
 * Каждая строка — ссылка на страницу направления (внутренняя перелинковка,
 * якорь — название направления). По наведению или фокусу в строке раскрывается
 * кадр сцены направления шторкой слева; на телефоне, где наведения нет, строка
 * раскрывается, когда проходит середину экрана. Картинка монтируется только
 * после первого раскрытия, поэтому семь кадров не грузятся вместе со страницей.
 *
 * Кадры — безымянные иллюстрации сцен (scene-stills.ts), без клиента и подписи.
 */
'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { SERVICE_DIRECTIONS, directionHref, type ServiceDirection } from '@/lib/services/directions'
import { sceneFrame, sceneFramesFor } from '@/lib/services/scene-stills'
import { KIT_KICKER, setTitle, typo } from '../direction/direction-kit'
import { SplitWords } from './split-words'

/** У коммерческого направления нет собственной сцены: берём нейтральный кадр */
const COMMERCIAL_FRAME = sceneFrame('cinema-suits')

/**
 * Подпись под названием: клиенты направления. Строки с ценой из directions.meta
 * на /about не берём — ориентиры бюджета живут на страницах направлений.
 */
const PROOF_OVERRIDES: Partial<Record<ServiceDirection['id'], string>> = {
  commercial: 'WELLERY / OHTAPARK / BEST WESTERN / DIESEL',
  'content-production': 'WELLERY / ZARINA / CHERRY',
}

const proofLine = (direction: ServiceDirection) => PROOF_OVERRIDES[direction.id] ?? direction.meta

function frameFor(direction: ServiceDirection) {
  return sceneFramesFor(direction.id, 1)[0] ?? COMMERCIAL_FRAME
}

function Row({ direction, position }: { direction: ServiceDirection; position: number }) {
  const [seen, setSeen] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)
  const frame = frameFor(direction)

  const wake = useCallback(() => setSeen(true), [])

  // Телефон и планшет без наведения: строка «просыпается» у середины экрана
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (!window.matchMedia('(hover: none)').matches) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        node.dataset.live = entry.isIntersecting ? 'true' : 'false'
        if (entry.isIntersecting) setSeen(true)
      },
      { rootMargin: '-42% 0px -42% 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <li
      data-reveal=""
      style={{ '--reveal-delay': `${position * 50}ms` } as CSSProperties}
      className="border-b border-white/15"
    >
      <Link
        ref={ref}
        href={directionHref(direction)}
        onPointerEnter={wake}
        onFocus={wake}
        className="about-dir-row group relative isolate grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-4 overflow-hidden px-6 py-7 md:grid-cols-[4rem_minmax(0,1.5fr)_minmax(0,1fr)_auto] md:gap-x-8 md:px-10 md:py-9 lg:px-20"
      >
        <span aria-hidden="true" className="about-dir-bg absolute inset-0 -z-10">
          {seen ? (
            <Image
              src={frame.src}
              alt=""
              fill
              quality={50}
              sizes="(max-width: 767px) 100vw, 100vw"
              className="object-cover"
              style={{ objectPosition: frame.position }}
            />
          ) : null}
          <span className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/25" />
        </span>

        <span className="dir-kit-meta font-mono tabular-nums text-white/60 transition-colors group-hover:text-white group-focus-visible:text-white">
          {direction.index}
        </span>

        <span className="min-w-0">
          <span className="about-dir-title block font-stage uppercase leading-[0.98] tracking-[-0.03em] text-white [overflow-wrap:anywhere]">
            {setTitle(direction.title)}
          </span>
          <span className="dir-kit-meta mt-2 block font-mono uppercase text-white/55 md:hidden">
            {direction.label}
          </span>
        </span>

        <span className="hidden max-w-[26rem] md:block">
          <span className="block text-[0.95rem] font-extralight leading-relaxed text-white/75">
            {typo(direction.description)}
          </span>
          <span className="dir-kit-meta mt-3 block font-mono uppercase text-white/55">
            {proofLine(direction)}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="about-dir-arrow flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white"
        >
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </Link>
    </li>
  )
}

export function AboutDirections() {
  const directions = SERVICE_DIRECTIONS.filter(direction => direction.route.published)

  return (
    <section
      id="about-directions"
      aria-labelledby="about-directions-title"
      className="relative border-t border-white/10 bg-black pt-16 md:pt-24"
    >
      <div className="px-6 md:px-10 lg:px-20">
        <div data-reveal="" className={KIT_KICKER}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          03 / Направления
        </div>
        <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] md:items-end md:gap-12">
          <h2
            id="about-directions-title"
            data-reveal=""
            className="font-stage text-[clamp(2rem,5vw,4.5rem)] uppercase leading-[0.95] tracking-[-0.035em] text-white text-balance [overflow-wrap:anywhere]"
          >
            <SplitWords text={'Семь направлений — у каждого своя страница'} />
          </h2>
          <p
            data-reveal=""
            style={{ '--reveal-delay': '80ms' } as CSSProperties}
            className="max-w-[28rem] text-[0.95rem] font-extralight leading-relaxed text-white/70 md:justify-self-end md:text-base"
          >
            {typo(
              'Одна студия, несколько территорий. Выберите ближайшую к вашей задаче: на странице направления — работы, этапы и ответы на вопросы.'
            )}
          </p>
        </div>
      </div>

      <ul className="mt-12 border-t border-white/15 md:mt-16">
        {directions.map((direction, position) => (
          <Row key={direction.id} direction={direction} position={position} />
        ))}
      </ul>
    </section>
  )
}
