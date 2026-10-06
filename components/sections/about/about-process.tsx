/**
 * Как мы работаем — «плёнка».
 *
 * От lg секция закреплена, и пять этапов едут по горизонтали как кадры на
 * ленте с перфорацией; красная нить внизу — позиция воспроизведения, рядом
 * «этап 02 / 05». Скролл превращается в горизонталь только числом: DOM один
 * (обычный <ol>), ниже lg он остаётся вертикальным списком с рельсой слева, а
 * transform гасится стилем. Ширину сдвига считает ResizeObserver, поэтому
 * любая длина текста и шрифт не ломают конец ленты.
 *
 * Этапы — те же пять, что на /reklamny-rolik; сроков и цен здесь нет.
 */
'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'

import { ABOUT_PROCESS_NOTE, ABOUT_STAGES } from '@/lib/about/content'
import { KIT_KICKER, setTitle, typo } from '../direction/direction-kit'
import { useReduced } from './use-reduced'
import { SplitWords } from './split-words'

export function AboutProcess() {
  const reduced = useReduced()
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const shift = useMotionValue(0)
  const [stage, setStage] = useState(1)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.35 })
  const x = useTransform([smooth, shift], ([p, s]: number[]) => -(p ?? 0) * (s ?? 0))

  // Сколько ленте ехать: ширина дорожки минус ширина окна, плюс запас под правое поле
  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    const section = sectionRef.current
    if (!viewport || !track || !section) return

    const measure = () => {
      const wide = window.matchMedia('(min-width: 64rem)').matches
      const distance = wide ? Math.max(0, track.scrollWidth - viewport.clientWidth) : 0
      shift.set(distance)
      section.style.setProperty('--about-shift', `${distance}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [shift])

  useMotionValueEvent(scrollYProgress, 'change', value => {
    const next = Math.min(
      ABOUT_STAGES.length,
      Math.max(1, Math.floor(value * ABOUT_STAGES.length) + 1)
    )
    setStage(current => (current === next ? current : next))
  })

  return (
    <section
      ref={sectionRef}
      id="about-process"
      aria-labelledby="about-process-title"
      data-reduced={reduced ? 'true' : undefined}
      data-sticky-hide="lg"
      className="about-process relative border-t border-white/10 bg-black"
    >
      <div className="about-process-stick flex flex-col justify-center gap-10 py-20 md:gap-12 md:py-28 lg:gap-7 lg:py-0">
        <div className="px-6 md:px-10 lg:px-20">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <div className="max-w-[48rem]">
              <div data-reveal="" className={KIT_KICKER}>
                <span aria-hidden="true" className="h-px w-8 bg-accent" />
                05 / Как мы работаем
              </div>
              <h2
                id="about-process-title"
                data-reveal=""
                className="mt-6 font-stage text-[clamp(1.9rem,3.6vw,3.4rem)] uppercase leading-[0.95] tracking-[-0.035em] text-white text-balance [overflow-wrap:anywhere]"
              >
                <SplitWords text={'От задачи до готовых версий — пять этапов'} />
              </h2>
            </div>
            <p
              aria-hidden="true"
              className="dir-kit-meta hidden font-mono uppercase tabular-nums text-white/70 lg:block"
            >
              Этап {String(stage).padStart(2, '0')} / {String(ABOUT_STAGES.length).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div ref={viewportRef} className="about-film relative flex-none overflow-hidden">
          <motion.ol
            ref={trackRef}
            className="about-track flex gap-5 px-6 md:px-10 lg:gap-6 lg:px-20"
            style={{ x: reduced ? 0 : x }}
          >
            {ABOUT_STAGES.map((item, index) => (
              <li
                key={item.index}
                data-reveal=""
                style={{ '--reveal-delay': `${index * 50}ms` } as CSSProperties}
                className="about-frame relative flex flex-col justify-between border border-white/20 bg-[#050505] p-6 md:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="about-frame-index font-stage" aria-hidden="true">
                    {item.index}
                  </span>
                  <span className="dir-kit-meta pt-2 font-mono uppercase tabular-nums text-white/55">
                    Кадр {item.index}
                  </span>
                </div>
                <div className="mt-10">
                  <h3 className="font-brand-hero text-[clamp(1.5rem,2.6vw,2.3rem)] uppercase leading-[1] tracking-tighter text-white [overflow-wrap:anywhere]">
                    <span className="sr-only">{item.index}. </span>
                    {setTitle(item.title)}
                  </h3>
                  <p className="mt-4 text-[0.95rem] font-extralight leading-relaxed text-white/75">
                    {typo(item.text)}
                  </p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <li
                        key={tag}
                        className="dir-kit-meta border border-white/20 px-3 py-1.5 font-mono uppercase text-white/70"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </motion.ol>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5 px-6 md:px-10 lg:px-20">
          <div
            aria-hidden="true"
            className="about-playhead relative hidden h-px flex-1 bg-white/20 lg:block"
          >
            <motion.span
              className="absolute inset-y-0 left-0 w-full origin-left bg-accent"
              style={{ scaleX: reduced ? 1 : scrollYProgress, height: 2, top: -0.5 }}
            />
          </div>
          <p className="max-w-[34rem] text-sm font-extralight leading-relaxed text-white/65">
            {typo(ABOUT_PROCESS_NOTE.text)}{' '}
            {ABOUT_PROCESS_NOTE.links.map((link, index) => (
              <span key={link.href}>
                {index > 0 ? ' · ' : ''}
                <Link
                  href={link.href}
                  className="text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-accent focus-visible:decoration-accent"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
