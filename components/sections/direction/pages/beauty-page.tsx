/**
 * /beauty-video — «МАКРО».
 *
 * Метафора: линза. Первый экран почти чёрный, кадр виден только внутри
 * круга, который ведёт за указателем (на тач-экране и без указателя круг
 * плавает сам). Дальше — «наезд»: круг на скролле раскрывается до полного
 * кадра, пока слова меняются «текстура → свет → кожа → вода».
 *
 * Производительность: положение круга пишется напрямую в CSS-переменные
 * (без React-состояния), маска — на одном слое. При prefers-reduced-motion
 * круг неподвижен и достаточно большой, чтобы кадр читался.
 */
'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { BEAUTY_PAGE } from '@/lib/services/pages/content/beauty'
import {
  interleaveFrames,
  type DirectionPageWork,
  type SceneFrame,
} from '@/lib/services/pages/resolve'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionCredits } from '../direction-credits'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { DirectionProcess } from '../direction-process'
import { DIRECTION_READING } from '@/lib/services/pages'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'

export interface BeautyPageProps {
  works: DirectionPageWork[]
}

function Hero({ frame }: { frame: SceneFrame | null }) {
  const page = useDirectionPage()
  const reduced = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    if (reduced) {
      stage.style.setProperty('--lens-x', '68%')
      stage.style.setProperty('--lens-y', '46%')
      stage.style.setProperty('--lens-r', '34vmin')
      return
    }

    let raf = 0
    let x = 0.68
    let y = 0.46
    let tx = x
    let ty = y
    let lastMove = -10_000
    const start = performance.now()

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect()
      tx = (event.clientX - rect.left) / rect.width
      ty = (event.clientY - rect.top) / rect.height
      lastMove = performance.now()
    }

    const tick = (now: number) => {
      // Без указателя круг дрейфует по медленной фигуре — экран не замирает
      if (now - lastMove > 2200) {
        const t = (now - start) / 1000
        tx = 0.62 + Math.sin(t * 0.45) * 0.16
        ty = 0.48 + Math.cos(t * 0.33) * 0.14
      }
      x += (tx - x) * 0.07
      y += (ty - y) * 0.07
      stage.style.setProperty('--lens-x', `${(x * 100).toFixed(2)}%`)
      stage.style.setProperty('--lens-y', `${(y * 100).toFixed(2)}%`)
      raf = requestAnimationFrame(tick)
    }

    stage.style.setProperty('--lens-r', '30vmin')
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduced])

  const mask =
    'radial-gradient(circle var(--lens-r, 30vmin) at var(--lens-x, 68%) var(--lens-y, 46%), #000 0%, #000 55%, transparent 100%)'

  return (
    <section className="relative flex min-h-[100svh] w-full items-end overflow-hidden bg-[#000000] px-6 pb-14 pt-28 md:px-10 md:pb-16 lg:px-20">
      <div ref={stageRef} aria-hidden="true" className="absolute inset-0 z-0">
        {frame ? (
          <>
            {/* Тёмный слой: кадр едва читается, чтобы линза открывала, а не выдумывала */}
            <Still
              src={frame.src}
              alt=""
              priority
              sizes="100vw"
              className="h-full w-full opacity-[0.16]"
            />
            {/* Светлый слой: виден только внутри круга */}
            <div className="absolute inset-0" style={{ WebkitMaskImage: mask, maskImage: mask }}>
              <Still src={frame.src} alt="" sizes="100vw" className="h-full w-full" />
            </div>
          </>
        ) : null}
        <span className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      <div className="relative z-10 w-full">
        <div className="hero-reveal">
          <p className="type-meta font-mono uppercase text-white/60">
            03 / BEAUTY · Санкт-Петербург · Москва · по России
          </p>

          <h1 className="mt-8 max-w-[14ch] font-stage text-[clamp(2.8rem,11vw,10rem)] uppercase leading-[0.86] tracking-[-0.035em] text-white md:mt-10">
            Beauty<span className="text-accent">-</span>видео
            <span className="mt-6 block max-w-md font-sans text-base font-light normal-case leading-snug tracking-normal text-white/75 md:mt-8 md:text-xl">
              и предметная съёмка: текстура, кожа, свет и звук крупным планом
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            Для косметических брендов и брендов ухода. Снимаем так, чтобы продукт хотелось взять в
            руки, а кожа оставалась кожей.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => page.openBrief('hero')}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="relative z-10 transition-colors duration-[var(--motion-move)] group-hover:text-white">
                {BEAUTY_PAGE.ctaLabel}
              </span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-[transform,color] duration-[var(--motion-move)] group-hover:translate-x-1 group-hover:text-white" />
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
              />
            </button>
            <p className="type-meta font-mono uppercase text-white/45">
              Проведите курсором — линза откроет кадр
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * «Наезд»: круг раскрывается до полного кадра, слова меняются по ходу.
 * Высота секции — запас скролла для sticky-сцены; текст смены слов
 * декоративный, те же слова стоят в списке материалов ниже.
 */
function Zoom({ frame }: { frame: SceneFrame | null }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const radius = useTransform(scrollYProgress, [0, 0.8], reduced ? [150, 150] : [9, 150])
  const clip = useTransform(radius, r => `circle(${r}% at 50% 50%)`)
  const scale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1.7, 1])

  const words = BEAUTY_PAGE.words
  if (!frame) return null

  return (
    <section ref={ref} aria-hidden="true" className="relative h-[260svh] bg-[#000000]">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <motion.div style={{ clipPath: clip }} className="absolute inset-0">
          <motion.div style={{ scale }} className="h-full w-full">
            <Still src={frame.src} alt="" sizes="100vw" className="h-full w-full" />
          </motion.div>
          <span className="absolute inset-0 bg-black/25" />
        </motion.div>

        <div className="pointer-events-none relative z-10 flex flex-col items-start px-6 md:px-10 lg:px-20 w-full">
          {words.map((word, i) => (
            <ZoomWord
              key={word}
              word={word}
              index={i}
              total={words.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ZoomWord({
  word,
  index,
  total,
  progress,
}: {
  word: string
  index: number
  total: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const reduced = useReducedMotion()
  const start = 0.05 + (index / total) * 0.75
  const x = useTransform(progress, [start - 0.08, start + 0.08], reduced ? [0, 0] : [-16, 0])
  const color = useTransform(
    progress,
    [start - 0.05, start + 0.05],
    ['rgba(255,255,255,0.14)', 'rgba(255,255,255,1)']
  )

  return (
    <motion.span
      style={{ x, color }}
      className="block font-stage text-[clamp(3rem,13vw,11rem)] uppercase leading-[0.88] tracking-[-0.04em] mix-blend-difference"
    >
      {word}
    </motion.span>
  )
}

function Materials() {
  return (
    <section
      aria-labelledby="beauty-materials-title"
      className="border-t border-white/10 bg-[#0D0D0D] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <p className="type-meta font-mono uppercase text-white/50">04 / Что снимаем</p>
      <h2
        id="beauty-materials-title"
        data-reveal=""
        className="mt-4 max-w-[22ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
      >
        Пять материалов beauty-видео
      </h2>

      <ol className="mt-12 md:mt-16">
        {BEAUTY_PAGE.materials.map(material => (
          <li
            key={material.index}
            data-reveal=""
            className="group grid gap-x-10 gap-y-3 border-t border-white/10 py-7 last:border-b md:grid-cols-12 md:py-9"
          >
            <span className="type-meta font-mono uppercase text-white/45 transition-colors group-hover:text-accent md:col-span-1">
              {material.index}
            </span>
            <h3 className="font-stage text-[clamp(1.25rem,3vw,2.2rem)] uppercase leading-[0.98] tracking-[-0.02em] text-white md:col-span-6">
              {material.title}
            </h3>
            <p className="text-sm leading-relaxed text-white/60 md:col-span-5 md:text-base">
              {material.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function BeautyPage({ works }: BeautyPageProps) {
  const frames = interleaveFrames(works, 8)
  const heroFrame = frames[0] ?? null
  const zoomFrame = frames[2] ?? frames[1] ?? heroFrame
  const closing = frames[3] ?? frames[frames.length - 1]

  return (
    <DirectionShell id="beauty" stickyLabel={BEAUTY_PAGE.stickyLabel}>
      <Hero frame={heroFrame} />
      <Zoom frame={zoomFrame} />
      <Materials />
      <DirectionCredits
        index="05"
        title="Крупный план в работах"
        works={works}
        note="Beauty-работы студии"
      />
      <DirectionProcess
        index="06"
        title="От продукта до версий"
        lead="Пять шагов: что в продукте видит камера и как это превратить в ролик."
        steps={BEAUTY_PAGE.process}
      />
      <DirectionFaq index="07" title="Вопросы о beauty-видео" items={BEAUTY_PAGE.faq} />
      <OtherDirections current="beauty" reading={DIRECTION_READING['beauty']} />
      <DirectionEnd
        lines={['Какой продукт', 'снимаем?']}
        ctaLabel={BEAUTY_PAGE.ctaLabel}
        note="Расскажите про продукт и площадки — вернёмся с форматом съёмки и ориентиром по бюджету."
        frame={closing ? { src: closing.src, alt: closing.client } : null}
      />
    </DirectionShell>
  )
}
