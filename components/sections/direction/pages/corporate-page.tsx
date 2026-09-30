/**
 * /corporate-video — «ГЛАВЫ».
 *
 * Метафора: фильм о компании как книга из четырёх глав. Это самый спокойный
 * язык из шести страниц — корпоративный заказчик покупает ясность и
 * предсказуемость, а не эффект. Слева стоит залипающая стойка: номер главы,
 * оглавление-ссылки и кадр, который меняется жёсткой склейкой (без
 * растворения — так же, как в монтаже). Справа идут главы.
 *
 * Оглавление — обычные якорные ссылки: работает с клавиатуры и без скриптов,
 * активная глава подсвечивается наблюдателем пересечения.
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { CORPORATE_PAGE } from '@/lib/services/pages/content/corporate'
import { interleaveFrames, type DirectionPageWork } from '@/lib/services/pages/resolve'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionCredits } from '../direction-credits'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { DirectionProcess } from '../direction-process'
import { DIRECTION_READING } from '@/lib/services/pages'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'

export interface CorporatePageProps {
  works: DirectionPageWork[]
}

/** Таймкод в углу первого экрана: идёт по секундам, при reduced-motion стоит */
function Timecode() {
  const reduced = useReducedMotion()
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setSeconds(value => (value + 1) % 6000), 1000)
    return () => window.clearInterval(id)
  }, [reduced])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return (
    <span aria-hidden="true" className="type-meta font-mono uppercase tabular-nums text-white/60">
      TC 00:{mm}:{ss}
    </span>
  )
}

function Hero({ frame }: { frame: { src: string; client: string } | null }) {
  const page = useDirectionPage()
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 800], [0, reduced ? 0 : 80])
  const scale = useTransform(scrollY, [0, 800], [1.04, reduced ? 1.04 : 1.14])

  return (
    <section className="relative grid min-h-[100svh] w-full grid-cols-1 overflow-hidden bg-[#000000] md:grid-cols-12">
      <div className="relative z-10 flex flex-col justify-end px-6 pb-14 pt-28 md:col-span-8 md:px-10 md:pb-16 lg:px-20">
        <div className="hero-reveal">
          <div className="flex items-baseline justify-between gap-6">
            <p className="type-meta font-mono uppercase text-white/60">
              05 / CORPORATE · Санкт-Петербург · Москва · по России
            </p>
            <Timecode />
          </div>

          <h1 className="mt-8 md:mt-10">
            <span className="block font-stage text-[clamp(2.2rem,6.4vw,6.4rem)] uppercase leading-[0.88] tracking-[-0.035em] text-white">
              Фильм
            </span>
            <span className="block font-stage text-[clamp(2.2rem,6.4vw,6.4rem)] uppercase leading-[0.88] tracking-[-0.035em] text-white">
              о компании
            </span>
            <span className="mt-7 block max-w-lg text-base font-light leading-snug text-white/75 md:text-xl">
              Корпоративное видео о производстве, технологиях и людях — для клиентов, партнёров и
              будущих сотрудников
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/60 md:text-base">
            Четыре главы, понятные этапы согласований и никакой «обязательной программы». Вы знаете,
            что будет в кадре, ещё до выезда группы.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => page.openBrief('hero')}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="relative z-10 transition-colors duration-[var(--motion-move)] group-hover:text-white">
                {CORPORATE_PAGE.ctaLabel}
              </span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-[transform,color] duration-[var(--motion-move)] group-hover:translate-x-1 group-hover:text-white" />
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
              />
            </button>
            <a
              href="#chapters"
              className="inline-flex items-center gap-2 px-2 py-3 text-base text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="border-b border-white/30 pb-0.5">Четыре главы фильма</span>
            </a>
          </div>
        </div>
      </div>

      {/* Кадр занимает правую треть на всю высоту; на телефоне уходит в фон */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 md:relative md:col-span-4 md:min-h-full"
      >
        {frame ? (
          <motion.div style={{ y, scale }} className="dir-clip-left h-full w-full">
            <Still
              src={frame.src}
              alt=""
              priority
              sizes="(min-width: 768px) 34vw, 100vw"
              className="h-full w-full"
            />
          </motion.div>
        ) : null}
        <span className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40 md:bg-gradient-to-r md:from-black md:via-transparent md:to-transparent" />
      </div>
    </section>
  )
}

function Chapters({ works }: { works: DirectionPageWork[] }) {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const panelRefs = useRef<(HTMLElement | null)[]>([])
  const bySlug = new Map(works.map(work => [work.slug, work]))

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number((entry.target as HTMLElement).dataset.chapter)
          if (!Number.isNaN(index)) setActive(index)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )
    panelRefs.current.forEach(node => node && observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const chapters = CORPORATE_PAGE.chapters.map(chapter => {
    const work = bySlug.get(chapter.slug)
    const src = work?.stills[chapter.still ?? 0] ?? work?.posterUrl ?? null
    return { ...chapter, src, client: work?.client ?? null }
  })

  return (
    <section
      id="chapters"
      aria-labelledby="corporate-chapters-title"
      className="border-t border-white/10 bg-[#0D0D0D] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <p className="type-meta font-mono uppercase text-white/50">02 / Структура фильма</p>
      <h2
        id="corporate-chapters-title"
        data-reveal=""
        className="mt-4 max-w-[20ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
      >
        Фильм из четырёх глав
      </h2>

      <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:gap-16">
        {/* Стойка: номер, оглавление, кадр-склейка */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24">
            <p
              aria-hidden="true"
              className="font-stage text-[clamp(5rem,12vw,11rem)] leading-[0.8] tracking-[-0.05em] text-white tabular-nums"
            >
              {CORPORATE_PAGE.chapters[active]?.number}
              <span className="text-white/20">/04</span>
            </p>

            <ul className="mt-8">
              {CORPORATE_PAGE.chapters.map((chapter, index) => (
                <li key={chapter.number} className="border-t border-white/10 last:border-b">
                  <a
                    href={`#chapter-${chapter.number}`}
                    aria-current={index === active ? 'true' : undefined}
                    className="flex items-baseline gap-4 py-3 text-lg text-white/45 transition-colors duration-[var(--motion-state)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent aria-[current=true]:text-white"
                  >
                    <span className="type-meta font-mono uppercase">{chapter.number}</span>
                    <span>{chapter.title}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div
              className="relative mt-8 aspect-[16/10] w-full overflow-hidden bg-[#000000]"
              aria-hidden="true"
            >
              {chapters.map((chapter, index) =>
                chapter.src ? (
                  // Склейка: неактивные кадры в разметке, но скрыты — без растворения
                  <div
                    key={chapter.number}
                    className={index === active ? 'absolute inset-0' : 'invisible absolute inset-0'}
                  >
                    <Still
                      src={chapter.src}
                      alt=""
                      sizes="40vw"
                      quality={65}
                      className="h-full w-full"
                    />
                  </div>
                ) : null
              )}
              <span className="type-meta-sm absolute bottom-0 left-0 bg-black/75 px-2 py-1 font-mono uppercase text-white">
                {chapters[active]?.client ? `Кадр из работы: ${chapters[active]?.client}` : ''}
              </span>
              {reduced ? null : (
                <motion.span
                  key={active}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 origin-right bg-accent"
                />
              )}
            </div>
          </div>
        </div>

        {/* Главы */}
        <ol className="lg:col-span-7">
          {chapters.map((chapter, index) => (
            <li
              key={chapter.number}
              id={`chapter-${chapter.number}`}
              data-chapter={index}
              ref={node => {
                panelRefs.current[index] = node
              }}
              className="flex min-h-[46svh] scroll-mt-28 flex-col justify-center border-t border-white/10 py-12 first:border-t-0 lg:min-h-[70svh]"
            >
              {chapter.src ? (
                <Still
                  src={chapter.src}
                  alt={chapter.client ? `Кадр из работы ${chapter.client}` : ''}
                  sizes="(min-width: 1024px) 0px, 100vw"
                  quality={65}
                  className="mb-8 aspect-video w-full lg:hidden"
                />
              ) : null}
              <p className="type-meta font-mono uppercase text-accent">Глава {chapter.number}</p>
              <h3
                data-reveal=""
                className="mt-4 font-stage text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.92] tracking-[-0.03em] text-white"
              >
                {chapter.title}
              </h3>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
                {chapter.text}
              </p>
              <p className="type-meta mt-8 max-w-xl border-l border-accent/70 pl-4 font-mono uppercase leading-relaxed text-white/55">
                От вас: {chapter.ask}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Audiences() {
  return (
    <section
      aria-labelledby="corporate-audiences-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <p className="type-meta font-mono uppercase text-white/50">03 / Для кого фильм</p>
      <h2
        id="corporate-audiences-title"
        data-reveal=""
        className="mt-4 max-w-[22ch] font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
      >
        Один материал — три аудитории
      </h2>
      <ul className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
        {CORPORATE_PAGE.audiences.map(item => (
          <li key={item.title} data-reveal="" className="border-t border-white/15 pt-6">
            <h3 className="text-xl font-light tracking-tight text-white md:text-2xl">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">{item.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-20 border-t border-white/15 pt-10">
        <p className="type-meta font-mono uppercase text-white/50">Что нужно от компании</p>
        <ul className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {CORPORATE_PAGE.asks.map((ask, index) => (
            <li key={ask.title} data-reveal="" className="flex gap-4">
              <span className="type-meta font-mono uppercase text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-lg font-light text-white">{ask.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{ask.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function CorporatePage({ works }: CorporatePageProps) {
  const frames = interleaveFrames(works, 6)
  const hero = frames[0] ?? null
  const closing = frames[frames.length - 1]

  return (
    <DirectionShell id="corporate" stickyLabel={CORPORATE_PAGE.stickyLabel}>
      <Hero frame={hero} />
      <Chapters works={works} />
      <Audiences />
      <DirectionCredits
        index="04"
        title="Корпоративные работы"
        works={works}
        note="Работы для компаний и брендов"
      />
      <DirectionProcess
        index="05"
        title="Этапы и согласования"
        lead="Пять шагов, на каждом из которых вы видите результат и принимаете решение."
        steps={CORPORATE_PAGE.process}
      />
      <DirectionFaq index="06" title="Вопросы о корпоративном видео" items={CORPORATE_PAGE.faq} />
      <OtherDirections current="corporate" reading={DIRECTION_READING['corporate']} />
      <DirectionEnd
        lines={['О чём', 'расскажем', 'про вас?']}
        ctaLabel={CORPORATE_PAGE.ctaLabel}
        note="Расскажите, кому и где будете показывать фильм — вернёмся с форматом, этапами и предварительной оценкой."
        frame={closing ? { src: closing.src, alt: closing.client } : null}
      />
    </DirectionShell>
  )
}
