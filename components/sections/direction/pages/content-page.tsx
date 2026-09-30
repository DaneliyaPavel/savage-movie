/**
 * /content-production — «МОНТАЖНЫЙ ЛИСТ».
 *
 * Метафора: одна съёмка раскладывается на восемь выдач. Мастер-кадр стоит на
 * весь экран; на скролле из него «вырезаются» прямоугольники с метками
 * форматов и расходятся от центра, пока сам кадр гаснет. Движение — только
 * transform и clip-path на слоях одного и того же изображения, загруженного
 * один раз.
 *
 * Смысл не в фокусе, а в аргументе: клиент видит, что восемь материалов
 * режутся из одного съёмочного дня. Тот же аргумент лежит текстом в таблице
 * ниже и в FAQ, а не только в анимации.
 */
'use client'

import { useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import {
  CONTENT_CROPS,
  CONTENT_PAGE,
  type CropCell,
} from '@/lib/services/pages/content/content-production'
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

export interface ContentPageProps {
  works: DirectionPageWork[]
}

function Hero() {
  const page = useDirectionPage()
  return (
    <section className="relative flex min-h-[88svh] w-full flex-col justify-end border-b border-white/10 bg-[#000000] px-6 pb-14 pt-28 md:px-10 md:pb-16 lg:px-20">
      <div className="hero-reveal">
        <p className="type-meta font-mono uppercase text-white/60">
          04 / CONTENT · Санкт-Петербург · Москва · по России
        </p>
        <h1 className="mt-8 md:mt-10">
          <span className="block font-stage text-[clamp(2.6rem,10.4vw,9.5rem)] uppercase leading-[0.86] tracking-[-0.04em] text-white">
            Одна съёмка
          </span>
          <span className="dir-outline block font-brand-hero text-[clamp(2.6rem,10.4vw,9.5rem)] uppercase leading-[0.86] tracking-[-0.04em]">
            восемь выдач
          </span>
          <span className="mt-8 block max-w-xl text-base font-light leading-snug text-white/75 md:text-xl">
            Регулярный видеопродакшн: материалы на квартал для сайта, соцсетей и магазинов
          </span>
        </h1>
        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => page.openBrief('hero')}
            className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="relative z-10 transition-colors duration-[var(--motion-move)] group-hover:text-white">
              {CONTENT_PAGE.ctaLabel}
            </span>
            <ArrowRight className="relative z-10 h-4 w-4 transition-[transform,color] duration-[var(--motion-move)] group-hover:translate-x-1 group-hover:text-white" />
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
            />
          </button>
          <a
            href="#sheet"
            className="inline-flex items-center gap-2 px-2 py-3 text-base text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="border-b border-white/30 pb-0.5">Как это работает</span>
          </a>
        </div>
      </div>
    </section>
  )
}

function Crop({
  cell,
  frame,
  progress,
  reduced,
}: {
  cell: CropCell
  frame: SceneFrame
  progress: MotionValue<number>
  reduced: boolean | null
}) {
  // Куда уезжает вырезка: от центра листа в сторону собственного центра
  const dx = (cell.x + cell.w / 2 - 50) * 0.22
  const dy = (cell.y + cell.h / 2 - 50) * 0.22
  const x = useTransform(progress, [0.25, 0.85], ['0%', reduced ? '0%' : `${dx}%`])
  const y = useTransform(progress, [0.25, 0.85], ['0%', reduced ? '0%' : `${dy}%`])
  const scale = useTransform(progress, [0.25, 0.85], [1, reduced ? 1 : 0.94])
  const outline = useTransform(progress, [0.2, 0.45], [0, 1])

  const clip = `inset(${cell.y}% ${100 - cell.x - cell.w}% ${100 - cell.y - cell.h}% ${cell.x}%)`

  return (
    <motion.div
      style={{
        clipPath: clip,
        x,
        y,
        scale,
        transformOrigin: `${cell.x + cell.w / 2}% ${cell.y + cell.h / 2}%`,
      }}
      className="absolute inset-0"
    >
      <Still
        src={frame.src}
        alt=""
        sizes="(min-width: 768px) 92vw, 100vw"
        className="h-full w-full"
      />
      <motion.span
        style={{
          opacity: reduced ? 1 : outline,
          left: `${cell.x}%`,
          top: `${cell.y}%`,
          width: `${cell.w}%`,
          height: `${cell.h}%`,
        }}
        className="absolute border border-accent/90"
      />
      <span
        style={{ left: `${cell.x}%`, top: `${cell.y}%` }}
        className="type-meta-sm absolute m-1.5 bg-black/70 px-1.5 py-0.5 font-mono uppercase text-white"
      >
        {cell.label}
      </span>
    </motion.div>
  )
}

function Sheet({ frame }: { frame: SceneFrame | null }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [count, setCount] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const dim = useTransform(scrollYProgress, [0.2, 0.7], [1, reduced ? 1 : 0.14])

  useMotionValueEvent(scrollYProgress, 'change', value => {
    const next = Math.max(0, Math.min(CONTENT_CROPS.length, Math.round((value - 0.2) * 14)))
    setCount(current => (current === next ? current : next))
  })

  if (!frame) return null

  return (
    <section
      id="sheet"
      ref={ref}
      aria-label="Одна съёмка раскладывается на восемь материалов"
      className="relative h-[300svh] bg-[#000000]"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-4 overflow-hidden px-3 md:px-8">
        <div className="relative aspect-[4/3] w-full max-w-[min(92vw,calc((100svh-9rem)*1.6))] md:aspect-[16/10]">
          <motion.div style={{ opacity: dim }} className="absolute inset-0">
            <Still src={frame.src} alt="" priority sizes="100vw" className="h-full w-full" />
          </motion.div>
          {CONTENT_CROPS.map(cell => (
            <Crop
              key={cell.key}
              cell={cell}
              frame={frame}
              progress={scrollYProgress}
              reduced={reduced}
            />
          ))}
        </div>

        <p
          aria-hidden="true"
          className="type-meta flex w-full max-w-[min(92vw,calc((100svh-9rem)*1.6))] justify-between font-mono uppercase text-white/55"
        >
          <span>Мастер-кадр: {frame.client}</span>
          <span>
            {String(count).padStart(2, '0')} / {String(CONTENT_CROPS.length).padStart(2, '0')}
          </span>
        </p>
      </div>
    </section>
  )
}

function Outputs() {
  return (
    <section
      aria-labelledby="content-outputs-title"
      className="border-t border-white/10 bg-[#0D0D0D] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="type-meta font-mono uppercase text-white/50">05 / Состав выдачи</p>
          <h2
            id="content-outputs-title"
            data-reveal=""
            className="mt-4 font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
          >
            Что получаете с одной съёмки
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-white/60">
            Стандартный набор — восемь материалов. Состав меняем под ваш контент-план: что-то
            убираем, что-то добавляем.
          </p>
        </div>

        <dl className="lg:col-span-8">
          {CONTENT_PAGE.outputs.map((output, index) => (
            <div
              key={`${output.label}-${index}`}
              data-reveal=""
              className="group grid grid-cols-[2.5rem_7rem_1fr] items-baseline gap-x-4 border-t border-white/10 py-5 last:border-b md:grid-cols-[3rem_9rem_1fr] md:py-6"
            >
              <span className="type-meta font-mono uppercase text-white/40 transition-colors group-hover:text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <dt className="font-stage text-lg uppercase tracking-[-0.02em] text-white md:text-2xl">
                {output.label}
              </dt>
              <dd className="text-sm leading-relaxed text-white/60 md:text-base">{output.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Audiences() {
  return (
    <section
      aria-labelledby="content-audiences-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <p className="type-meta font-mono uppercase text-white/50">06 / Кому подходит</p>
      <h2
        id="content-audiences-title"
        data-reveal=""
        className="mt-4 max-w-[22ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
      >
        Когда один ролик — мало
      </h2>
      <ul className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
        {CONTENT_PAGE.audiences.map(item => (
          <li key={item.title} data-reveal="" className="border-t border-white/15 pt-6">
            <h3 className="text-xl font-light tracking-tight text-white md:text-2xl">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ContentPage({ works }: ContentPageProps) {
  const frames = interleaveFrames(works, 6)
  const master = frames[0] ?? null
  const closing = frames[frames.length - 1]

  return (
    <DirectionShell id="content-production" stickyLabel={CONTENT_PAGE.stickyLabel}>
      <Hero />
      <Sheet frame={master} />
      <Outputs />
      <Audiences />
      <DirectionCredits
        index="07"
        title="Съёмки под поток материалов"
        works={works}
        note="Работы, из которых идёт регулярный контент"
      />
      <DirectionProcess
        index="08"
        title="Как планируем квартал"
        lead="Главное решение принимается до съёмки: какие материалы нужны и где они будут жить."
        steps={CONTENT_PAGE.process}
      />
      <DirectionFaq index="09" title="Вопросы о регулярном продакшне" items={CONTENT_PAGE.faq} />
      <OtherDirections
        current="content-production"
        reading={DIRECTION_READING['content-production']}
      />
      <DirectionEnd
        lines={['Сколько', 'материалов', 'нужно?']}
        ctaLabel={CONTENT_PAGE.ctaLabel}
        note="Расскажите про контент-план и площадки — вернёмся с форматом съёмки и предварительной оценкой."
        frame={closing ? { src: closing.src, alt: closing.client } : null}
      />
    </DirectionShell>
  )
}
