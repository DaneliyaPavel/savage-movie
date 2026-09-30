/**
 * /fashion-video — «РАЗВОРОТ».
 *
 * Метафора: журнальный разворот, который листают. Композиция намеренно
 * асимметрична — заголовок уехал влево и вниз, портретные кадры стоят
 * ступенькой и едут с разной скоростью, контурное слово спорит со сплошным.
 * Ничего центрированного, один доминирующий элемент на экран.
 *
 * Движение — только transform от скролла (framer useScroll) и clip-path на
 * входе кадра. Текст физически в разметке и виден с первого кадра; на
 * телефоне ступенька схлопывается в один кадр под заголовком.
 */
'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'

import { FASHION_PAGE } from '@/lib/services/pages/content/fashion'
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

export interface FashionPageProps {
  works: DirectionPageWork[]
}

/** Кадр по кругу: если галерей меньше, чем слотов, сцена не остаётся дырявой */
function pick(frames: SceneFrame[], index: number): SceneFrame | null {
  if (frames.length === 0) return null
  return frames[index % frames.length] ?? null
}

function Hero({ frames }: { frames: SceneFrame[] }) {
  const page = useDirectionPage()
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const slow = useTransform(scrollY, [0, 900], [0, reduced ? 0 : -60])
  const mid = useTransform(scrollY, [0, 900], [0, reduced ? 0 : -150])
  const fast = useTransform(scrollY, [0, 900], [0, reduced ? 0 : -260])
  const titleShift = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 90])

  const a = pick(frames, 0)
  const b = pick(frames, 1)
  const c = pick(frames, 2)

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#000000] px-6 pb-14 pt-28 md:px-10 md:pb-16 lg:px-20">
      {/* Мобильный фон: один кадр под заголовком */}
      {a ? (
        <div aria-hidden="true" className="absolute inset-0 z-0 md:hidden">
          <Still src={a.src} alt="" priority sizes="100vw" className="h-full w-full" />
          <span className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </div>
      ) : null}

      {/* Ступенька портретных кадров (десктоп) */}
      <div aria-hidden="true" className="absolute inset-0 z-0 hidden md:block">
        {a ? (
          <div
            style={{ '--dir-delay': '100ms' } as React.CSSProperties}
            className="dir-clip-up absolute right-[6%] top-[14%] w-[20vw] max-w-[22rem]"
          >
            <motion.div style={{ y: slow }}>
              <Still src={a.src} alt="" priority sizes="22rem" className="aspect-[3/4] w-full" />
            </motion.div>
          </div>
        ) : null}
        {b ? (
          <div
            style={{ '--dir-delay': '260ms' } as React.CSSProperties}
            className="dir-clip-up absolute right-[30%] top-[30%] w-[16vw] max-w-[17rem]"
          >
            <motion.div style={{ y: mid }}>
              <Still src={b.src} alt="" sizes="17rem" className="aspect-[3/4] w-full" />
            </motion.div>
          </div>
        ) : null}
        {c ? (
          <div
            style={{ '--dir-delay': '420ms' } as React.CSSProperties}
            className="dir-clip-up absolute right-[2%] top-[58%] w-[13vw] max-w-[14rem]"
          >
            <motion.div style={{ y: fast }}>
              <Still src={c.src} alt="" sizes="14rem" className="aspect-[3/4] w-full" />
            </motion.div>
          </div>
        ) : null}
        <span className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="hero-reveal">
          <p className="type-meta font-mono uppercase text-white/60">
            02 / FASHION · Санкт-Петербург · Москва · по России
          </p>

          <motion.h1 style={{ y: titleShift }} className="mt-8 md:mt-10">
            <span className="block font-stage text-[clamp(3.4rem,17vw,15rem)] uppercase leading-[0.82] tracking-[-0.04em] text-white">
              Fashion
            </span>
            <span className="dir-outline -mt-1 ml-[8vw] block font-brand-hero text-[clamp(3.4rem,17vw,15rem)] uppercase leading-[0.82] tracking-[-0.04em] md:ml-[14vw]">
              видео
            </span>
            <span className="mt-8 block max-w-md text-base font-light leading-snug tracking-normal text-white/75 md:mt-10 md:text-xl">
              для коллекций, кампаний и дропов
            </span>
          </motion.h1>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            Снимаем образ, а не каталог: режиссура, свет и монтаж под характер коллекции. Главный
            ролик и версии под сайт, соцсети и маркетплейсы — за одну съёмку.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => page.openBrief('hero')}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="relative z-10 transition-colors duration-[var(--motion-move)] group-hover:text-white">
                {FASHION_PAGE.ctaLabel}
              </span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-[transform,color] duration-[var(--motion-move)] group-hover:translate-x-1 group-hover:text-white" />
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
              />
            </button>
            <a
              href="#spread"
              className="inline-flex items-center gap-2 px-2 py-3 text-base text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="border-b border-white/30 pb-0.5">Смотреть разворот</span>
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Две строки бегущего набора едут навстречу друг другу от скролла страницы */
function Marquee({ words }: { words: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const left = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-28%'])
  const right = useTransform(scrollYProgress, [0, 1], [reduced ? '-28%' : '-46%', '-28%'])
  const line = [...words, ...words, ...words]

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="overflow-hidden border-y border-white/10 bg-[#000000] py-6 md:py-10"
    >
      <motion.p
        style={{ x: left }}
        className="whitespace-nowrap font-stage text-[clamp(2.6rem,9vw,8rem)] uppercase leading-none tracking-[-0.03em] text-white"
      >
        {line.map((word, i) => (
          <span key={`${word}-${i}`} className="mr-[0.4em]">
            {word}
            <span className="ml-[0.4em] text-accent">/</span>
          </span>
        ))}
      </motion.p>
      <motion.p
        style={{ x: right }}
        className="dir-outline mt-2 whitespace-nowrap font-brand-hero text-[clamp(2.6rem,9vw,8rem)] uppercase leading-none tracking-[-0.03em]"
      >
        {[...line].reverse().map((word, i) => (
          <span key={`${word}-r-${i}`} className="mr-[0.4em]">
            {word}
            <span className="ml-[0.4em]">/</span>
          </span>
        ))}
      </motion.p>
    </div>
  )
}

/** Три колонки кадров едут с разной скоростью: страница листается, а не скроллится */
function Spread({ frames, works }: { frames: SceneFrame[]; works: DirectionPageWork[] }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 120, reduced ? 0 : -160])
  const y2 = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : -60, reduced ? 0 : 120])
  const y3 = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 180, reduced ? 0 : -100])

  // Колонки получают кадры вперемешку, чтобы соседние были из разных съёмок
  const columns = [0, 1, 2].map(col => frames.filter((_, i) => i % 3 === col).slice(0, 3))
  const shifts = [y1, y2, y3]
  const names = Array.from(new Set(works.map(work => work.client))).join(' · ')

  return (
    <section
      id="spread"
      ref={ref}
      aria-label="Кадры из работ"
      className="relative overflow-hidden bg-[#000000] px-6 py-20 md:px-10 md:py-32 lg:px-20"
    >
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <h2
          data-reveal=""
          className="max-w-[14ch] font-brand-hero text-[clamp(2rem,6vw,5rem)] uppercase leading-[0.92] tracking-tighter text-white"
        >
          Ткань, свет, пластика
        </h2>
        {names ? (
          <p className="type-meta max-w-xs font-mono uppercase leading-relaxed text-white/50">
            Кадры из работ: {names}
          </p>
        ) : null}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-3 md:gap-6">
        {columns.map((column, col) => (
          <motion.div
            key={col}
            style={{ y: shifts[col] }}
            className={
              col === 2 ? 'hidden flex-col gap-3 md:flex md:gap-6' : 'flex flex-col gap-3 md:gap-6'
            }
          >
            {column.map((frame, i) => (
              <Still
                key={frame.key}
                src={frame.src}
                alt={`${frame.client} — ${frame.title}`}
                sizes="(min-width: 768px) 30vw, 50vw"
                quality={65}
                className={i % 2 === 0 ? 'aspect-[3/4] w-full' : 'aspect-[4/5] w-full'}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Formats() {
  return (
    <section
      aria-labelledby="fashion-formats-title"
      className="border-t border-white/10 bg-[#0D0D0D] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="type-meta font-mono uppercase text-white/50">03 / Что снимаем</p>
          <h2
            id="fashion-formats-title"
            data-reveal=""
            className="mt-4 font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
          >
            Три формата fashion-видео
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/60">
            Для брендов одежды, обуви и аксессуаров, которым нужно показать образ, а не перечислить
            вещи. Один формат или все три — в одной съёмке.
          </p>
        </div>

        <ul className="lg:col-span-7">
          {FASHION_PAGE.formats.map(format => (
            <li
              key={format.index}
              data-reveal=""
              className="group border-t border-white/10 py-8 last:border-b md:py-10"
            >
              <div className="grid grid-cols-[2.5rem_1fr] gap-x-4 md:grid-cols-[4rem_1fr]">
                <span className="type-meta font-mono uppercase text-white/45 transition-colors group-hover:text-accent">
                  {format.index}
                </span>
                <div>
                  <h3 className="font-stage text-[clamp(1.4rem,3.6vw,2.6rem)] uppercase leading-[0.95] tracking-[-0.02em] text-white transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-2 motion-reduce:transition-none">
                    {format.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60 md:text-base">
                    {format.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function FashionPage({ works }: FashionPageProps) {
  const frames = interleaveFrames(works, 9)
  const closing = frames[frames.length - 1]

  return (
    <DirectionShell id="fashion" stickyLabel={FASHION_PAGE.stickyLabel}>
      <Hero frames={frames} />
      <Marquee words={FASHION_PAGE.marquee} />
      <Spread frames={frames} works={works} />
      <Formats />
      <DirectionCredits
        index="04"
        title="Коллекции в движении"
        works={works}
        note="Fashion-работы студии"
      />
      <DirectionProcess
        index="05"
        title="От брифа до версий"
        lead="Пять шагов от идеи до файлов под каждую площадку."
        steps={FASHION_PAGE.process}
      />
      <DirectionFaq index="06" title="Вопросы о fashion-видео" items={FASHION_PAGE.faq} />
      <OtherDirections current="fashion" reading={DIRECTION_READING['fashion']} />
      <DirectionEnd
        lines={['Какая', 'коллекция', 'следующая?']}
        ctaLabel={FASHION_PAGE.ctaLabel}
        note="Расскажите про коллекцию и площадки — вернёмся с форматом съёмки и ориентиром по бюджету."
        frame={closing ? { src: closing.src, alt: closing.client } : null}
      />
    </DirectionShell>
  )
}
