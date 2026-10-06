/**
 * Позиция студии: «правка» и четыре принципа.
 *
 * Слева — липкая колонка с редакторской правкой («креативное агентство»
 * зачёркивается красной линией, рядом — «продакшн-студия»), справа — список
 * принципов, у каждого красная риска прорисовывается при входе в экран.
 * Принципы — позиция владельца (BRAND.md), не обещания с цифрами.
 */
'use client'

import type { CSSProperties } from 'react'

import { ABOUT_PRINCIPLES } from '@/lib/about/content'
import { KIT_KICKER, setTitle, typo } from '../direction/direction-kit'

export function AboutPrinciples() {
  return (
    <section
      id="about-principles"
      aria-labelledby="about-principles-title"
      className="relative border-t border-white/10 bg-black px-6 py-20 md:px-10 md:py-32 lg:px-20"
    >
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div data-reveal="" className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            04 / Позиция
          </div>
          <h2
            id="about-principles-title"
            data-reveal=""
            className="mt-6 font-stage text-[clamp(1.9rem,3.7vw,3.4rem)] uppercase leading-[0.95] tracking-[-0.035em] text-white text-balance [overflow-wrap:anywhere]"
          >
            {setTitle('Как мы думаем о работе')}
          </h2>

          <p
            data-reveal=""
            style={{ '--reveal-delay': '120ms' } as CSSProperties}
            className="about-correction mt-10 font-brand-hero uppercase leading-[0.95] tracking-tighter"
          >
            <span className="about-correction-wrong text-white/45">Креативное агентство</span>
            <span className="sr-only"> — исправлено на: </span>
            <span className="mt-2 block text-white">Продакшн-студия</span>
          </p>
        </div>

        <ol className="border-t border-white/15">
          {ABOUT_PRINCIPLES.map((principle, index) => (
            <li
              key={principle.index}
              data-reveal=""
              style={{ '--reveal-delay': `${index * 60}ms` } as CSSProperties}
              className="about-principle grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-b border-white/15 py-8 md:grid-cols-[4.5rem_minmax(0,1fr)] md:py-11"
            >
              <span className="dir-kit-meta pt-2 font-mono tabular-nums text-accent">
                {principle.index}
              </span>
              <div>
                <h3 className="font-brand-hero text-[clamp(1.45rem,2.9vw,2.4rem)] uppercase leading-[1] tracking-tighter text-white [overflow-wrap:anywhere]">
                  {setTitle(principle.title)}
                </h3>
                <span aria-hidden="true" className="about-draw mt-5 block h-px w-16 bg-accent" />
                <p className="mt-5 max-w-[34rem] text-base font-extralight leading-relaxed text-white/75">
                  {typo(principle.text)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
