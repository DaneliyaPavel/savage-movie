/**
 * Каркас страницы направления: шапка, меню, бриф, футер и цели Метрики.
 *
 * Всё, что не должно различаться от страницы к странице, живёт здесь: форма
 * заявки (та же, что на /reklamny-rolik и /services — одна реализация
 * антиспама, атрибуции и конверсии), sticky-CTA, атрибуция рекламного клика,
 * размеченный направлением бриф. Композиция страницы приходит как children.
 */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import type { ServiceDirectionId } from '@/lib/services/directions'
import { DirectionPageContext, type DirectionPageApi } from './direction-context'

export interface DirectionShellProps {
  id: ServiceDirectionId
  /** Подпись sticky-полосы на телефоне */
  stickyLabel: string
  children: ReactNode
  /** Фон страницы: у каждого направления он свой оттенок чёрного */
  className?: string
}

export function DirectionShell({ id, stickyLabel, children, className }: DirectionShellProps) {
  const [isFormInView, setIsFormInView] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const viewTrackedRef = useRef(false)
  const rootRef = useReveal<HTMLElement>()

  useEffect(() => {
    captureAttribution()
    if (viewTrackedRef.current) return
    viewTrackedRef.current = true
    trackMetrikaGoal('service_page_view', { service: id })
    trackMetrikaGoal('service_direction_view', { service: id })
  }, [id])

  // Sticky-CTA не нужен, когда на экране форма или финальный CTA страницы:
  // он закрывал бы поля и дублировал бы главную кнопку
  useEffect(() => {
    const targets = ['estimate', 'direction-end']
      .map(nodeId => document.getElementById(nodeId))
      .filter((node): node is HTMLElement => node !== null)
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<Element>()
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        setIsFormInView(visible.size > 0)
      },
      { rootMargin: '-10% 0px -10% 0px' }
    )
    targets.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const openBrief = useCallback(
    (location: string) => {
      trackMetrikaGoal('estimate_cta_click', { location: `${id}_${location}` })
      trackMetrikaGoal('service_brief_open', { service: id })
      const node = document.getElementById('estimate')
      if (!node) return
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    },
    [id]
  )

  const openCase = useCallback(
    (slug: string) => trackMetrikaGoal('service_case_open', { service: id, case_slug: slug }),
    [id]
  )

  const api = useMemo<DirectionPageApi>(
    () => ({ id, openBrief, openCase }),
    [id, openBrief, openCase]
  )

  return (
    <DirectionPageContext.Provider value={api}>
      <MotionConfig reducedMotion="user">
        <main ref={rootRef} className={className ?? 'min-h-screen bg-[#000000] pb-20 md:pb-0'}>
          <TopBar />
          <JalousieMenu />

          {children}

          <EstimateForm
            content={SERVICES_BRIEF}
            success={SERVICES_BRIEF_SUCCESS}
            sla={DEFAULT_COMMERCIAL_LANDING.sla}
            presetProjectType={id}
            serviceDirection={id}
            onBookingClick={() => trackMetrikaGoal('booking_click', { location: `${id}_brief` })}
            onSubmitted={() => setIsSubmitted(true)}
          />

          <SiteFooter />

          <StickyEstimateCta
            label={stickyLabel}
            onClick={() => openBrief('sticky')}
            hidden={isFormInView || isSubmitted}
          />
        </main>
      </MotionConfig>
    </DirectionPageContext.Provider>
  )
}
