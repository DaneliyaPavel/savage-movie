/**
 * /music-video — «БИТ».
 *
 * Метафора: клип держится за трек. Первый экран режется по доле: кадры
 * меняются жёсткой склейкой каждые две доли выбранного темпа, снизу бьёт
 * эквалайзер с тем же периодом, в углу идёт счёт «такт · доля». Темп
 * выбирает посетитель — это единственное «игрушечное» взаимодействие на
 * странице, и оно доказывает тезис (монтаж привязан к ритму), а не
 * развлекает.
 *
 * Безопасность движения: склейка по доле без вспышек (смена кадра и тонкая
 * красная кромка, без полноэкранного белого), максимум один переход за
 * ~0.85 с при 140 уд/мин; при prefers-reduced-motion кадры не сменяются,
 * эквалайзер стоит.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { MUSIC_PAGE } from '@/lib/services/pages/content/music'
import {
  interleaveFrames,
  type DirectionPageWork,
  type SceneFrame,
} from '@/lib/services/pages/resolve'
import { cn } from '@/lib/utils'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionCredits } from '../direction-credits'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { DIRECTION_READING } from '@/lib/services/pages'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'

export interface MusicPageProps {
  works: DirectionPageWork[]
}

const EQ_BARS = 28

/** Псевдослучайные, но стабильные высоты: на сервере и клиенте одинаковы */
const eqPeak = (i: number) => 0.35 + Math.abs(Math.sin(i * 1.7) * 0.45 + Math.cos(i * 0.6) * 0.2)

function Hero({ frames }: { frames: SceneFrame[] }) {
  const page = useDirectionPage()
  const reduced = useReducedMotion()
  const [bpm, setBpm] = useState(MUSIC_PAGE.tempos[2] ?? 128)
  const [beat, setBeat] = useState(0)

  // Доля: счётчик тикает в темпе; кадр меняется каждые две доли
  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setBeat(value => value + 1), 60000 / bpm)
    return () => window.clearInterval(id)
  }, [bpm, reduced])

  const beatMs = Math.round(60000 / bpm)
  const cutIndex = frames.length > 0 ? Math.floor(beat / 2) % frames.length : 0
  const bar = Math.floor(beat / 4) + 1
  const inBar = (beat % 4) + 1

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#000000] px-6 pb-14 pt-28 md:px-10 md:pb-16 lg:px-20">
      <div aria-hidden="true" className="absolute inset-0 z-0">
        {frames.map((frame, index) => (
          <div
            key={frame.key}
            className={cn('absolute inset-0', index === cutIndex ? 'visible' : 'invisible')}
          >
            <Still
              src={frame.src}
              alt=""
              priority={index === 0}
              sizes="100vw"
              className="h-full w-full"
            />
          </div>
        ))}
        <span className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        {/* Кромка на доле: тонкая красная линия сверху, без заливки экрана */}
        <span
          key={beat}
          className={cn(
            'absolute inset-x-0 top-0 h-px origin-left bg-accent',
            reduced ? 'hidden' : 'dir-beat-line'
          )}
          style={{ animationDuration: `${beatMs}ms` }}
        />

        {/* Эквалайзер */}
        <div
          className="absolute inset-x-0 bottom-0 flex h-[22svh] items-end gap-[3px] px-6 opacity-70 md:px-10 lg:px-20"
          style={{ ['--eq-beat' as string]: `${beatMs * 2}ms` }}
        >
          {Array.from({ length: EQ_BARS }, (_, i) => (
            <span
              key={i}
              className="dir-eq-bar h-full flex-1 bg-white/20"
              style={
                {
                  '--eq-peak': eqPeak(i).toFixed(2),
                  '--eq-delay': `${(i * 37) % beatMs}ms`,
                  '--eq-rest': (0.2 + (eqPeak(i) - 0.35) * 0.6).toFixed(2),
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="hero-reveal">
          <div className="flex items-baseline justify-between gap-6">
            <p className="type-meta font-mono uppercase text-white/60">
              07 / MUSIC · Санкт-Петербург · Москва · по России
            </p>
            <p
              aria-hidden="true"
              className="type-meta font-mono uppercase tabular-nums text-white/60"
            >
              Такт {String(bar).padStart(2, '0')} · доля {inBar}
            </p>
          </div>

          <h1 className="mt-8 md:mt-10">
            <span className="block font-stage text-[clamp(2.2rem,8.4vw,8.5rem)] uppercase leading-[0.86] tracking-[-0.04em] text-white">
              Музыкальный
            </span>
            <span className="dir-outline block font-brand-hero text-[clamp(2.2rem,8.4vw,8.5rem)] uppercase leading-[0.86] tracking-[-0.04em]">
              клип
            </span>
            <span className="mt-7 block max-w-xl text-base font-light leading-snug text-white/75 md:text-xl">
              Режиссура, сет, съёмка и монтаж, который держится за трек
            </span>
          </h1>

          <div className="mt-9 flex flex-col gap-6 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => page.openBrief('hero')}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="relative z-10 transition-colors duration-[var(--motion-move)] group-hover:text-white">
                {MUSIC_PAGE.ctaLabel}
              </span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-[transform,color] duration-[var(--motion-move)] group-hover:translate-x-1 group-hover:text-white" />
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
              />
            </button>

            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="type-meta mb-2 font-mono uppercase text-white/50">
                Темп склейки, уд/мин
              </legend>
              {MUSIC_PAGE.tempos.map(tempo => (
                <button
                  key={tempo}
                  type="button"
                  onClick={() => setBpm(tempo)}
                  aria-pressed={bpm === tempo}
                  className={cn(
                    'rounded-sm border px-3.5 py-2 font-mono text-xs uppercase tabular-nums transition-[color,background-color,border-color] duration-[var(--motion-state)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    bpm === tempo
                      ? 'border-accent bg-accent text-white'
                      : 'border-white/25 text-white/70 hover:border-white/60 hover:text-white'
                  )}
                >
                  {tempo}
                </button>
              ))}
            </fieldset>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Волна с маркерами склеек: заливается красным от скролла — монтаж идёт по треку */
function Wave() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 40%'] })
  const fill = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ['inset(0 0% 0 0)', 'inset(0 0% 0 0)'] : ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
  )
  const bars = Array.from(
    { length: 72 },
    (_, i) => 0.18 + Math.abs(Math.sin(i * 0.7) * 0.5 + Math.sin(i * 0.23) * 0.3)
  )
  const cuts = [9, 18, 27, 36, 45, 54, 63]

  const row = (tone: string) => (
    <div className="flex h-full items-center gap-[2px] md:gap-[3px]">
      {bars.map((peak, i) => (
        <span
          key={i}
          className={cn('flex-1 rounded-[1px]', tone)}
          style={{ height: `${Math.min(100, peak * 100)}%` }}
        />
      ))}
    </div>
  )

  return (
    <section
      ref={ref}
      aria-labelledby="music-wave-title"
      className="border-t border-white/10 bg-[#0D0D0D] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <p className="type-meta font-mono uppercase text-white/50">02 / Монтаж под бит</p>
      <h2
        id="music-wave-title"
        data-reveal=""
        className="mt-4 max-w-[18ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
      >
        Каждая склейка — на доле
      </h2>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">
        Мы не иллюстрируем трек, а работаем внутри его структуры: план съёмки и монтаж строятся от
        композиции. Звукорежиссура и синхронизация монтажа — часть клипа, а не отдельная услуга.
      </p>

      <div aria-hidden="true" className="relative mt-14 h-28 md:h-40">
        <div className="absolute inset-0">{row('bg-white/15')}</div>
        <motion.div style={{ clipPath: fill }} className="absolute inset-0">
          {row('bg-accent')}
        </motion.div>
        {cuts.map(cut => (
          <span
            key={cut}
            className="absolute inset-y-[-10%] w-px bg-white/40"
            style={{ left: `${(cut / bars.length) * 100}%` }}
          >
            <span className="type-meta-sm absolute -top-5 left-1 font-mono uppercase text-white/45">
              cut
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}

function Stages() {
  return (
    <section
      aria-labelledby="music-stages-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <p className="type-meta font-mono uppercase text-white/50">03 / От трека до клипа</p>
      <h2
        id="music-stages-title"
        data-reveal=""
        className="mt-4 max-w-[20ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
      >
        Полный цикл в одной студии
      </h2>

      <ol className="mt-14">
        {MUSIC_PAGE.stages.map(stage => (
          <li
            key={stage.number}
            data-reveal=""
            className="group grid gap-x-10 gap-y-3 border-t border-white/10 py-7 last:border-b md:grid-cols-12 md:py-10"
          >
            <span className="type-meta font-mono uppercase text-white/45 transition-colors group-hover:text-accent md:col-span-1">
              {stage.number}
            </span>
            <h3 className="font-stage text-[clamp(1.3rem,3vw,2.3rem)] uppercase leading-[0.98] tracking-[-0.02em] text-white md:col-span-5">
              {stage.title}
            </h3>
            <p className="text-sm leading-relaxed text-white/60 md:col-span-6 md:text-base">
              {stage.text}
            </p>
          </li>
        ))}
      </ol>

      <ul className="mt-20 grid gap-x-10 gap-y-10 md:grid-cols-3">
        {MUSIC_PAGE.audiences.map(item => (
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

export function MusicPage({ works }: MusicPageProps) {
  const frames = interleaveFrames(works, 12)
  const closing = frames[frames.length - 1]

  return (
    <DirectionShell id="music" stickyLabel={MUSIC_PAGE.stickyLabel}>
      <Hero frames={frames.slice(0, 8)} />
      <Wave />
      <Stages />
      <DirectionCredits index="04" title="Клипы" works={works} note="Музыкальные работы студии" />
      <DirectionFaq index="05" title="Вопросы о съёмке клипа" items={MUSIC_PAGE.faq} />
      <DirectionEnd
        lines={['Какой', 'трек', 'снимаем?']}
        ctaLabel={MUSIC_PAGE.ctaLabel}
        note="Пришлите трек или идею — вернёмся с концепцией, форматом съёмки и предварительной оценкой."
        frame={closing ? { src: closing.src, alt: closing.client } : null}
      />
      <OtherDirections current="music" reading={DIRECTION_READING['music']} />
    </DirectionShell>
  )
}
