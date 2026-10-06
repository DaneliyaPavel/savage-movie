/**
 * Каркас страницы /about: шапка, меню, бриф, футер и sticky-CTA.
 *
 * Устроен как DirectionShell, но без привязки к направлению: у /about нет
 * service_direction, поэтому бриф открывается без предвыбранного типа и без
 * новых целей Метрики (используется существующая estimate_cta_click с
 * location вида about_*). Форма та же, что на /reklamny-rolik и /services, —
 * одна реализация антиспама, атрибуции и конверсии.
 *
 * Контракты для блоков:
 *  - data-sticky-hide на элементе — пока он на экране, плавающая кнопка сметы скрыта
 *    (плюс форма #estimate и финал #about-end);
 *  - main получает .about-shell: скрим под шапкой после первых 48px прокрутки.
 */
'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SiteFooter } from '@/components/sections/site-footer'
import { EstimateForm } from '@/components/sections/commercial/estimate-form'
import { StickyEstimateCta } from '@/components/sections/commercial/sticky-estimate-cta'
import { useReveal } from '@/components/sections/clients/use-reveal'
import { captureAttribution } from '@/lib/analytics/attribution'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { DEFAULT_COMMERCIAL_LANDING } from '@/lib/commercial-landing/content'
import { SERVICES_BRIEF, SERVICES_BRIEF_SUCCESS } from '@/lib/services/brief'
import { AboutPageContext, type AboutPageApi } from './about-context'
import { reducedNow } from './use-reduced'

import './about.css'

const STICKY_HIDE_TARGETS = '#estimate, #about-end, [data-sticky-hide]'

export function AboutShell({ children }: { children: ReactNode }) {
  const [isFormInView, setIsFormInView] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const rootRef = useReveal<HTMLElement>()

  useEffect(() => {
    captureAttribution()
  }, [])

  // Скрим под шапкой появляется, когда первые 48px страницы ушли с экрана
  useEffect(() => {
    const root = rootRef.current
    const sentinel = root?.querySelector<HTMLElement>('[data-header-sentinel]')
    if (!root || !sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      root.dataset.scrolled = entry && !entry.isIntersecting ? 'true' : 'false'
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [rootRef])

  // Sticky-CTA не нужен, когда на экране форма или финальный призыв
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<Element>()
    // data-sticky-hide="lg" действует от lg: ниже блок не закреплён и кнопке не мешает
    const wide = window.matchMedia('(min-width: 64rem)')
    const isBlocking = (node: Element) =>
      (node as HTMLElement).dataset.stickyHide !== 'lg' || wide.matches
    const update = () => setIsFormInView(Array.from(visible).some(isBlocking))
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        update()
      },
      { rootMargin: '-10% 0px -10% 0px' }
    )
    root.querySelectorAll(STICKY_HIDE_TARGETS).forEach(node => observer.observe(node))
    wide.addEventListener('change', update)
    return () => {
      wide.removeEventListener('change', update)
      observer.disconnect()
    }
  }, [rootRef])

  const openBrief = useCallback((location: string) => {
    trackMetrikaGoal('estimate_cta_click', { location: `about_${location}` })
    const node = document.getElementById('estimate')
    if (!node) return
    node.scrollIntoView({ behavior: reducedNow() ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const api = useMemo<AboutPageApi>(() => ({ openBrief }), [openBrief])

  return (
    <AboutPageContext.Provider value={api}>
      <MotionConfig reducedMotion="user">
        <main ref={rootRef} className="about-shell relative min-h-screen bg-black pb-20 md:pb-0">
          <TopBar />
          <JalousieMenu />
          <span
            aria-hidden="true"
            data-header-sentinel=""
            className="pointer-events-none absolute left-0 top-0 h-12 w-px"
          />
          <span aria-hidden="true" className="about-header-scrim" />

          {children}

          <EstimateForm
            content={SERVICES_BRIEF}
            success={SERVICES_BRIEF_SUCCESS}
            sla={DEFAULT_COMMERCIAL_LANDING.sla}
            presetProjectType={null}
            serviceDirection={null}
            onBookingClick={() => trackMetrikaGoal('booking_click', { location: 'about_brief' })}
            onSubmitted={() => setIsSubmitted(true)}
          />

          <SiteFooter />

          <StickyEstimateCta
            label="Обсудить проект"
            onClick={() => openBrief('sticky')}
            hidden={isFormInView || isSubmitted}
          />
        </main>
      </MotionConfig>
    </AboutPageContext.Provider>
  )
}
