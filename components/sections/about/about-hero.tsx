/**
 * Первый экран /about — «Окно в кадр».
 *
 * Метафора: видоискатель. Страница открывается чёрным полем с узким окном, в
 * котором стоит кадр, и огромным названием студии поверх. Пока человек
 * листает, окно раскрывается до полного кадра, слова названия расходятся в
 * стороны, а поверх затемнённого кадра слово за словом загорается манифест
 * и последним — вывод «Кадр важнее декора».
 *
 * Движение: только transform, clip-path и opacity. Текст H1 физически в
 * разметке и виден с первого кадра (вход — keyframes со сдвигом в маске, без
 * opacity:0 и без ожидания JS). Закреплённая сцена — одна sticky-секция
 * высотой в три с половиной экрана; при prefers-reduced-motion вместо неё
 * обычный блок с уже раскрытым кадром и полностью включённым манифестом.
 *
 * Кадр — безымянная иллюстрация сцены (lib/services/scene-stills.ts): не
 * работа клиента и не человек из команды, подписи у неё нет.
 */
'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { getImageProps } from 'next/image'
import { ArrowDown } from 'lucide-react'
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

import { ABOUT_HERO, ABOUT_MANIFESTO } from '@/lib/about/content'
import { sceneFrame } from '@/lib/services/scene-stills'
import { cn } from '@/lib/utils'
import { DirectionButton, typo } from '../direction/direction-kit'
import { useAboutPage } from './about-context'
import { useReduced } from './use-reduced'

/**
 * Кадр первого экрана: модель с лебедем на красной стене. Две пропорции
 * (вертикаль для телефона, широкий для остальных) подаются через <picture>:
 * браузер скачивает только нужную, а не обе, как было бы с двумя next/image.
 * Без клиента, проекта и логотипов (кадр из библиотеки сцен).
 */
const FRAME_WIDE = sceneFrame('swan-red-wall-wide')
const FRAME_TALL = sceneFrame('swan-red-wall')

function HeroPicture() {
  const common = { alt: '', fill: true, quality: 65 } as const
  const wide = getImageProps({ ...common, src: FRAME_WIDE.src, sizes: '100vw' })
  const tall = getImageProps({ ...common, src: FRAME_TALL.src, sizes: '200vw' })
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={wide.props.srcSet} sizes="100vw" />
      <img
        {...tall.props}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="about-hero-img object-cover"
        style={
          {
            ...tall.props.style,
            '--pos-tall': FRAME_TALL.position,
            '--pos-wide': FRAME_WIDE.position,
          } as CSSProperties
        }
      />
    </picture>
  )
}

/** Разбитая на буквы строка теряет кернинг: возвращаем его для пар, где он заметен */
const KERN: Record<string, string> = { AV: '-0.05em', VA: '-0.05em', OV: '-0.02em', VI: '-0.02em' }

/** Буквы названия: каждая поднимается из своей маски; текст остаётся текстом H1 */
function Letters({ text, from = 0 }: { text: string; from?: number }) {
  const chars = Array.from(text.toUpperCase())
  return (
    <>
      {chars.map((char, index) => (
        <span
          key={`${index}-${char}`}
          className="about-letter"
          style={
            {
              '--i': from + index,
              marginLeft: index > 0 ? KERN[chars[index - 1] + char] : undefined,
            } as CSSProperties
          }
        >
          {char}
        </span>
      ))}
    </>
  )
}

/** Окно видоискателя в начале: правее центра, чуть выше середины */
const WINDOW_START = 'inset(14% 6% 30% 38%)'
const WINDOW_FULL = 'inset(0% 0% 0% 0%)'

/** Доли прокрутки: раскрытие окна, затем манифест */
const OPEN_END = 0.3
const LIGHT_START = 0.4
const LIGHT_END = 0.93

function Word({
  children,
  progress,
  from,
  to,
  reduced,
}: {
  children: string
  progress: MotionValue<number>
  from: number
  to: number
  reduced: boolean
}) {
  const opacity = useTransform(progress, [from, to], [0.16, 1], { clamp: true })
  return (
    <motion.span style={{ opacity: reduced ? 1 : opacity }} className="inline">
      {children}
    </motion.span>
  )
}

/** Слова строки: фразы с неразрывными пробелами остаются целыми */
function words(text: string) {
  return typo(text).split(' ').filter(Boolean)
}

export function AboutHero() {
  const page = useAboutPage()
  const reduced = useReduced()
  const trackRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  const clipPath = useTransform(scrollYProgress, [0, OPEN_END], [WINDOW_START, WINDOW_FULL], {
    clamp: true,
  })
  const frameScale = useTransform(scrollYProgress, [0, OPEN_END], [1.24, 1.06], { clamp: true })

  // Кадр чуть следует за курсором: глубина без тяжёлого 3D. Только мышь, не телефон
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const frameX = useSpring(pointerX, { stiffness: 60, damping: 18, mass: 0.6 })
  const frameY = useSpring(pointerY, { stiffness: 60, damping: 18, mass: 0.6 })
  const stageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return
    }
    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect()
      pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * -26)
      pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * -18)
    }
    stage.addEventListener('pointermove', onMove)
    return () => stage.removeEventListener('pointermove', onMove)
  }, [reduced, pointerX, pointerY])
  const dim = useTransform(scrollYProgress, [0.16, 0.42], [0.12, 0.66], { clamp: true })
  const savageX = useTransform(scrollYProgress, [0, 0.24], ['0%', '-22%'], { clamp: true })
  const movieX = useTransform(scrollYProgress, [0, 0.24], ['0%', '22%'], { clamp: true })
  const titleOpacity = useTransform(scrollYProgress, [0.1, 0.27], [1, 0], { clamp: true })
  const uiOpacity = useTransform(scrollYProgress, [0.04, 0.2], [1, 0], { clamp: true })
  const manifestoOpacity = useTransform(scrollYProgress, [0.28, 0.4], [0, 1], { clamp: true })

  const manifestoWords = ABOUT_MANIFESTO.lines.flatMap(line => words(line))
  const punchWords = words(ABOUT_MANIFESTO.punch)
  const all = manifestoWords.length + punchWords.length
  const slot = (LIGHT_END - LIGHT_START) / all
  // Слово загорается за три слота: соседние перекрываются, и «волна» идёт плавно
  const range = (index: number): [number, number] => [
    LIGHT_START + slot * index,
    LIGHT_START + slot * (index + 3),
  ]

  return (
    <section
      ref={trackRef}
      id="about-top"
      data-reduced={reduced ? 'true' : undefined}
      aria-labelledby="about-title"
      className={cn('about-hero relative', reduced ? 'min-h-svh' : 'h-[360svh]')}
    >
      <div
        ref={stageRef}
        className={cn(
          'overflow-hidden bg-black',
          reduced ? 'relative min-h-svh' : 'sticky top-0 h-svh'
        )}
      >
        {/* Кадр: окно видоискателя, которое раскрывается на весь экран */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ clipPath: reduced ? WINDOW_FULL : clipPath }}
        >
          <motion.div
            className="absolute inset-0"
            style={reduced ? { scale: 1.06 } : { scale: frameScale, x: frameX, y: frameY }}
          >
            <HeroPicture />
          </motion.div>
          {/* Световая утечка: тёплое красное пятно медленно плывёт по кадру */}
          <span className="about-leak" />
          <motion.span
            className="absolute inset-0 bg-black"
            style={{ opacity: reduced ? 0.6 : dim }}
          />
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
          <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/70 to-transparent" />
        </motion.div>

        {/* Рамка видоискателя: четыре угла и точка записи */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 bottom-5 top-[5.5rem] md:inset-x-8 md:bottom-8 lg:inset-x-[4.5rem]"
          style={{ opacity: reduced ? 1 : uiOpacity }}
        >
          <span className="about-corner left-0 top-0 border-l border-t" />
          <span className="about-corner right-0 top-0 border-r border-t" />
          <span className="about-corner bottom-0 left-0 border-b border-l" />
          <span className="about-corner bottom-0 right-0 border-b border-r" />
        </motion.div>

        <div className="relative z-10 flex h-full min-h-svh flex-col justify-between px-6 pb-12 pt-24 md:px-10 md:pb-20 lg:px-20">
          {/* Верх: служебная строка и подводка */}
          <motion.div style={{ opacity: reduced ? 1 : uiOpacity }}>
            <p className="about-rise dir-kit-meta flex flex-wrap items-center gap-x-4 gap-y-2 font-mono uppercase text-white/75">
              <span className="flex items-center gap-2">
                <span className="about-rec h-1.5 w-1.5 rounded-full bg-accent" />
                REC
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              <span>{ABOUT_HERO.kicker}</span>
              <span aria-hidden="true" className="hidden h-3 w-px bg-white/30 sm:block" />
              <span className="hidden sm:inline">{ABOUT_HERO.place}</span>
            </p>
            <p
              className="about-rise mt-6 max-w-[24rem] text-[0.95rem] font-extralight leading-relaxed text-white/80 md:text-base"
              style={{ '--d': '300ms' } as CSSProperties}
            >
              {typo(ABOUT_HERO.lead)}
            </p>
          </motion.div>

          {/* Низ: название студии и главное действие */}
          <div>
            <motion.h1
              id="about-title"
              className="font-brand-hero uppercase text-white"
              style={{ opacity: reduced ? 1 : titleOpacity }}
            >
              <span className="about-brand">
                <motion.span className="about-mask" style={{ x: reduced ? 0 : savageX }}>
                  <span className="about-line">
                    <Letters text={ABOUT_HERO.brand[0]} />
                  </span>
                </motion.span>
                <motion.span className="about-mask" style={{ x: reduced ? 0 : movieX }}>
                  <span className="about-line">
                    <Letters text={ABOUT_HERO.brand[1]} from={ABOUT_HERO.brand[0].length} />
                  </span>
                </motion.span>
              </span>
              <span className="sr-only"> — </span>
              <span className="about-sub font-stage not-italic">{ABOUT_HERO.sub}</span>
            </motion.h1>

            <motion.div
              className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4"
              style={{ opacity: reduced ? 1 : uiOpacity }}
            >
              <DirectionButton
                label={ABOUT_HERO.cta}
                onClick={() => page.openBrief('hero')}
                className="w-full sm:w-auto sm:min-w-[19rem]"
              />
              <a
                href="#about-numbers"
                className="dir-kit-meta group inline-flex items-center gap-3 font-mono uppercase text-white/70 transition-colors hover:text-white focus-visible:text-white"
              >
                Листайте
                <ArrowDown
                  aria-hidden="true"
                  className="h-4 w-4 text-accent motion-safe:animate-bounce"
                />
              </a>
            </motion.div>
          </div>
        </div>

        {/* Манифест поверх раскрытого кадра */}
        <motion.div
          className={cn(
            'z-20 px-6 md:px-10 lg:px-20',
            reduced
              ? 'relative pb-20 pt-4 md:pb-28'
              : 'pointer-events-none absolute inset-0 flex flex-col justify-end pb-28 md:pb-24'
          )}
          style={{ opacity: reduced ? 1 : manifestoOpacity }}
        >
          <p className="about-manifesto max-w-[58rem] font-extralight text-white">
            <span className="sr-only">{ABOUT_MANIFESTO.lines.join(' ')} </span>
            <span aria-hidden="true">
              {manifestoWords.map((word, index) => (
                <Word
                  key={`${index}-${word}`}
                  progress={scrollYProgress}
                  from={range(index)[0]}
                  to={range(index)[1]}
                  reduced={reduced}
                >
                  {`${word} `}
                </Word>
              ))}
            </span>
          </p>
          <p className="about-punch mt-5 font-brand-hero uppercase text-white md:mt-7">
            <span className="sr-only">{ABOUT_MANIFESTO.punch}</span>
            <span aria-hidden="true">
              {punchWords.map((word, index) => (
                <Word
                  key={`punch-${index}-${word}`}
                  progress={scrollYProgress}
                  from={range(manifestoWords.length + index)[0]}
                  to={range(manifestoWords.length + index)[1]}
                  reduced={reduced}
                >
                  {`${word} `}
                </Word>
              ))}
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
