/**
 * Финал /about: вопрос гигантским курсивом, главная кнопка, прямые контакты и
 * контурный бегущий титр. Форма брифа идёт сразу ниже, поэтому кнопка
 * прокручивает на считаные пиксели. Лента на паузе вне экрана и выключена при
 * prefers-reduced-motion.
 */
'use client'

import { Fragment, useEffect, useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'

import { ABOUT_END } from '@/lib/about/content'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { TELEGRAM_URL } from '@/lib/commercial-landing/content'
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contacts'
import { DirectionButton, typo } from '../direction/direction-kit'
import { useAboutPage } from './about-context'

export function AboutEnd() {
  const page = useAboutPage()
  const marqueeRef = useRef<HTMLDivElement>(null)
  const last = ABOUT_END.lines.length - 1

  useEffect(() => {
    const node = marqueeRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      node.dataset.paused = String(entry ? !entry.isIntersecting : false)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const contact = (kind: string) => () => {
    if (kind === 'telegram') trackMetrikaGoal('telegram_click', { location: 'about_end' })
    if (kind === 'email') trackMetrikaGoal('email_click', { location: 'about_end' })
  }

  return (
    <section
      id="about-end"
      aria-labelledby="about-end-title"
      className="relative isolate flex min-h-[92svh] flex-col justify-between overflow-hidden border-t border-white/10 bg-black px-6 pt-12 md:px-10 md:pt-16 lg:px-20"
    >
      <span aria-hidden="true" className="about-glow -bottom-1/3 -left-1/4 -z-10 scale-125" />
      <div
        data-reveal=""
        className="dir-kit-meta flex flex-wrap items-center gap-x-4 gap-y-2 font-mono uppercase text-white/70"
      >
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          09 / {ABOUT_END.kicker}
        </span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-white/30 sm:block" />
        <span className="hidden sm:inline">Бриф · два шага</span>
      </div>

      <div className="py-12 md:py-16">
        <h2
          id="about-end-title"
          data-reveal=""
          className="about-end-title font-brand-hero uppercase tracking-tighter text-white"
        >
          {ABOUT_END.lines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 ? ' ' : null}
              <span className={index === last ? 'block text-accent' : 'block'}>{typo(line)}</span>
            </Fragment>
          ))}
        </h2>

        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6 md:mt-14">
          <DirectionButton
            label={ABOUT_END.cta}
            size="lg"
            onClick={() => page.openBrief('end')}
            className="w-full sm:w-auto sm:min-w-[24rem]"
          />
          <p className="max-w-[26rem] text-sm font-extralight leading-relaxed text-white/70">
            {typo(ABOUT_END.note)}
          </p>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 md:mt-14">
          {[
            { href: PHONE_HREF, label: PHONE_DISPLAY, kind: 'phone' },
            { href: EMAIL_HREF, label: EMAIL, kind: 'email' },
            { href: TELEGRAM_URL, label: 'Telegram', kind: 'telegram' },
          ].map(item => (
            <li key={item.kind}>
              <a
                href={item.href}
                onClick={contact(item.kind)}
                {...(item.kind === 'telegram'
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="dir-kit-meta inline-flex items-center gap-2 font-mono uppercase text-white underline decoration-white/35 underline-offset-8 transition-colors hover:decoration-accent focus-visible:decoration-accent"
              >
                {item.label}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-accent" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={marqueeRef}
        aria-hidden="true"
        className="about-marquee about-marquee-end -mx-6 md:-mx-10 lg:-mx-20"
      >
        <div className="about-marquee-track">
          {[0, 1].map(copy => (
            <div key={copy} className="about-marquee-row">
              {['Расскажите о задаче', 'Savage Movie', 'Санкт-Петербург', 'Москва'].map(word => (
                <span key={word} className="about-marquee-item">
                  {word}
                  <span className="about-marquee-sep" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
