/**
 * /ai-video — «ШОВ» и «СЛОИ».
 *
 * AI в Savage Movie — инструмент производства, а не эстетика, поэтому язык
 * страницы — не неон и не глитч, а монтажный шов: на первом экране кадр
 * разрезан вертикальной линией, левая часть — плоская чёрно-белая «плёнка»,
 * правая — готовый цвет. Шов двигается рукой (указатель, касание, стрелки
 * клавиатуры). Дальше — стопка слоёв «съёмка / генерация / постпродакшн»,
 * которая расходится на скролле.
 *
 * Шов — это демонстрация цвета и постпродакшна, а не заявление «слева камера,
 * справа нейросеть»; подпись об этом прямо говорит.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { AI_PAGE } from '@/lib/services/pages/content/ai'
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

export interface AiPageProps {
  works: DirectionPageWork[]
}

function Hero({ frame }: { frame: SceneFrame | null }) {
  const page = useDirectionPage()
  const reduced = useReducedMotion()
  const [pos, setPos] = useState(reduced ? 52 : 0)
  const movedRef = useRef(false)
  const stageRef = useRef<HTMLDivElement>(null)

  // Первое появление: шов сам проходит слева до середины и замирает
  useEffect(() => {
    if (reduced) return
    const timer = window.setTimeout(() => {
      if (!movedRef.current) setPos(52)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [reduced])

  const setFromPointer = (clientX: number) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    movedRef.current = true
    setPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
  }

  return (
    <section
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#000000] px-6 pb-14 pt-28 md:px-10 md:pb-16 lg:px-20"
      onPointerMove={event => {
        if (event.pointerType === 'mouse') setFromPointer(event.clientX)
      }}
    >
      <div ref={stageRef} className="absolute inset-0 z-0">
        {frame ? (
          <>
            <Still src={frame.src} alt="" priority sizes="100vw" className="h-full w-full" />
            <div
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `inset(0 ${100 - pos}% 0 0)`,
                transition: reduced ? undefined : 'clip-path 900ms var(--ease-out-expo)',
              }}
            >
              <Still
                src={frame.src}
                alt=""
                sizes="100vw"
                className="h-full w-full [filter:grayscale(1)_contrast(0.78)_brightness(0.72)]"
              />
            </div>
          </>
        ) : null}
        <span className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />

        {/* Шов */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-accent"
          style={{
            left: `${pos}%`,
            transition: reduced ? undefined : 'left 900ms var(--ease-out-expo)',
          }}
        >
          <span className="type-meta-sm absolute left-2 top-28 -translate-x-full whitespace-nowrap bg-black/70 px-1.5 py-0.5 font-mono uppercase text-white/80">
            ПЛЁНКА
          </span>
          <span className="type-meta-sm absolute left-2 top-28 bg-black/70 px-1.5 py-0.5 font-mono uppercase text-white/80">
            ФИНАЛ
          </span>
        </div>

        {/* Управление швом: обычный range — клавиатура, касание и ассистивные технологии из коробки */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(pos)}
          onChange={event => {
            movedRef.current = true
            setPos(Number(event.target.value))
          }}
          aria-label="Сдвинуть шов между плоской плёнкой и готовым кадром"
          className="absolute inset-x-0 top-0 z-20 h-[55%] w-full cursor-ew-resize opacity-0 [touch-action:pan-y]"
        />
      </div>

      <div className="pointer-events-none relative z-10">
        <div className="hero-reveal">
          <p className="type-meta font-mono uppercase text-white/60">
            06 / AI · Санкт-Петербург · Москва · по России
          </p>
          <h1 className="mt-8 md:mt-10">
            <span className="block font-stage text-[clamp(3.2rem,16vw,14rem)] uppercase leading-[0.82] tracking-[-0.045em] text-white">
              AI<span className="text-accent">-</span>видео
            </span>
            <span className="mt-7 block max-w-xl text-base font-light leading-snug text-white/75 md:text-xl">
              Гибридный продакшн: живая съёмка, генерация и постпродакшн в одной работе — без
              пластиковой картинки
            </span>
          </h1>

          <div className="pointer-events-auto mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => page.openBrief('hero')}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="relative z-10 transition-colors duration-[var(--motion-move)] group-hover:text-white">
                {AI_PAGE.ctaLabel}
              </span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-[transform,color] duration-[var(--motion-move)] group-hover:translate-x-1 group-hover:text-white" />
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
              />
            </button>
            <p className="type-meta max-w-xs font-mono uppercase leading-relaxed text-white/45">
              Сдвиньте шов: слева плоская плёнка, справа цвет и постпродакшн. Это схема, а не разбор
              кадра.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Layer({
  frame,
  index,
  progress,
  reduced,
}: {
  frame: SceneFrame
  index: number
  progress: MotionValue<number>
  reduced: boolean | null
}) {
  const offset = index * 34
  const y = useTransform(progress, [0.1, 0.7], [0, reduced ? 0 : offset * 2])
  const x = useTransform(progress, [0.1, 0.7], [0, reduced ? 0 : (index - 1) * 6])
  const filters = [
    '[filter:grayscale(1)_contrast(0.78)_brightness(0.72)]',
    '[filter:grayscale(0.4)_hue-rotate(185deg)_saturate(0.7)_contrast(1.05)]',
    '',
  ]

  return (
    <motion.div
      style={{ y, x, zIndex: 3 - index }}
      className="absolute inset-0 border border-white/20 bg-black shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
    >
      <Still
        src={frame.src}
        alt=""
        sizes="(min-width: 1024px) 50vw, 90vw"
        quality={65}
        className="h-full w-full"
        imgClassName={filters[index]}
      />
      <span className="type-meta-sm absolute left-0 top-0 bg-black/75 px-2 py-1 font-mono uppercase text-white">
        {AI_PAGE.layers[index]?.number} / {AI_PAGE.layers[index]?.title}
      </span>
    </motion.div>
  )
}

function Layers({ frame }: { frame: SceneFrame | null }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  return (
    <section
      ref={ref}
      aria-labelledby="ai-layers-title"
      className="relative border-t border-white/10 bg-[#0D0D0D]"
    >
      <div className="grid gap-10 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-12 lg:gap-16 lg:px-20">
        <div className="lg:col-span-6">
          <p className="type-meta font-mono uppercase text-white/50">02 / Слои</p>
          <h2
            id="ai-layers-title"
            data-reveal=""
            className="mt-4 max-w-[16ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
          >
            Три слоя одной работы
          </h2>
          <ol className="mt-10">
            {AI_PAGE.layers.map(layer => (
              <li
                key={layer.number}
                data-reveal=""
                className="group grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-white/10 py-7 last:border-b md:py-9"
              >
                <span className="type-meta font-mono uppercase text-white/45 transition-colors group-hover:text-accent">
                  {layer.number}
                </span>
                <div>
                  <h3 className="font-stage text-[clamp(1.3rem,2.8vw,2.2rem)] uppercase leading-[0.98] tracking-[-0.02em] text-white">
                    {layer.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60 md:text-base">
                    {layer.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div aria-hidden="true" className="lg:col-span-6">
          {frame ? (
            <div className="sticky top-24">
              <div className="relative mx-auto mb-44 aspect-[4/3] w-full max-w-xl">
                {[2, 1, 0].map(index => (
                  <Layer
                    key={index}
                    frame={frame}
                    index={index}
                    progress={scrollYProgress}
                    reduced={reduced}
                  />
                ))}
              </div>
              <p className="type-meta mt-10 font-mono uppercase leading-relaxed text-white/40">
                Схема слоёв. Порядок работы, а не разбор конкретного кадра.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function Fit() {
  return (
    <section
      aria-labelledby="ai-fit-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <p className="type-meta font-mono uppercase text-white/50">03 / Где это работает</p>
      <h2
        id="ai-fit-title"
        data-reveal=""
        className="mt-4 max-w-[24ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
      >
        Где AI даёт преимущество, а где нет
      </h2>

      <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="type-meta border-b border-accent/70 pb-3 font-mono uppercase text-accent">
            Подходит
          </p>
          <ul>
            {AI_PAGE.fits.map(item => (
              <li key={item.title} data-reveal="" className="border-b border-white/10 py-6">
                <h3 className="text-xl font-light tracking-tight text-white md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="type-meta border-b border-white/30 pb-3 font-mono uppercase text-white/60">
            Лучше снять камерой
          </p>
          <ul>
            {AI_PAGE.misfits.map(item => (
              <li key={item.title} data-reveal="" className="border-b border-white/10 py-6">
                <h3 className="text-xl font-light tracking-tight text-white md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function AiPage({ works }: AiPageProps) {
  const frames = interleaveFrames(works, 6)
  const heroFrame = frames[0] ?? null
  const layerFrame = frames[1] ?? heroFrame
  const closing = frames[frames.length - 1]

  return (
    <DirectionShell id="ai" stickyLabel={AI_PAGE.stickyLabel}>
      <Hero frame={heroFrame} />
      <Layers frame={layerFrame} />
      <Fit />
      <DirectionCredits
        index="04"
        title="AI и гибрид в работах"
        works={works}
        note="Проекты с генерацией"
      />
      <DirectionProcess
        index="05"
        title="Как строится гибридная работа"
        lead="Начинаем с задачи, а не с нейросети."
        steps={AI_PAGE.process}
      />
      <DirectionFaq index="06" title="Вопросы об AI-видео" items={AI_PAGE.faq} />
      <DirectionEnd
        lines={['Что нельзя', 'снять камерой?']}
        ctaLabel={AI_PAGE.ctaLabel}
        note="Расскажите задачу — скажем, где нужна генерация, а где лучше снять."
        frame={closing ? { src: closing.src, alt: closing.client } : null}
      />
      <OtherDirections current="ai" reading={DIRECTION_READING['ai']} />
    </DirectionShell>
  )
}
