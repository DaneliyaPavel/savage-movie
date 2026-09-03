/**
 * Клиентская сборка коммерческого лендинга /reklamny-rolik.
 *
 * Здесь живёт всё, что требует браузера: атрибуция рекламного клика, цели
 * Метрики, состояние формы и переходы между блоками. Контент и структурные
 * данные приходят готовыми с сервера — текст страницы попадает в DOM
 * при первом рендере, без ожидания гидратации.
 *
 * Разметка секций переиспользуема: следующие intent-страницы
 * (/video-o-kompanii, /video-dlya-vystavki) собираются из этих же компонентов
 * со своим контентом, кейсами и дефолтами формы.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { CommercialHero } from '@/components/sections/commercial/commercial-hero'
import { TrustStrip } from '@/components/sections/commercial/trust-strip'
import {
  CommercialCases,
  type CommercialCase,
} from '@/components/sections/commercial/commercial-cases'
import { TaskGrid } from '@/components/sections/commercial/task-grid'
import { CommercialShowreel } from '@/components/sections/commercial/commercial-showreel'
import { ProductionProcess } from '@/components/sections/commercial/production-process'
import { PricingBands } from '@/components/sections/commercial/pricing-bands'
import { WhySavage } from '@/components/sections/commercial/why-savage'
import { EstimateForm } from '@/components/sections/commercial/estimate-form'
import { CommercialFaq } from '@/components/sections/commercial/commercial-faq'
import { FinalCta } from '@/components/sections/commercial/final-cta'
import { StickyEstimateCta } from '@/components/sections/commercial/sticky-estimate-cta'

import type { Client } from '@/lib/api/clients'
import type { CommercialLandingContent, TaskItem } from '@/lib/commercial-landing/content'
import { captureAttribution } from '@/lib/analytics/attribution'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'

interface CommercialLandingClientProps {
  content: CommercialLandingContent
  cases: CommercialCase[]
  clients: Client[]
}

/** Откуда нажали CTA — параметр цели estimate_cta_click */
type CtaLocation = 'hero' | 'price' | 'middle' | 'final' | 'sticky'

export function CommercialLandingClient({
  content,
  cases,
  clients,
}: CommercialLandingClientProps) {
  const [presetProjectType, setPresetProjectType] = useState<string | null>(null)
  const [isFormInView, setIsFormInView] = useState(false)
  const viewTrackedRef = useRef(false)

  // Метки рекламного клика снимаем один раз при входе: до отправки формы
  // человек успевает уйти на кейс и вернуться, и URL к тому моменту чистый
  useEffect(() => {
    captureAttribution()

    if (viewTrackedRef.current) return
    viewTrackedRef.current = true
    trackMetrikaGoal('commercial_landing_view')
  }, [])

  /**
   * Плавающий CTA нужен только чтобы довести до формы. Когда форма на экране,
   * он и бесполезен, и мешает: на мобильных нижняя полоса закрывает последние
   * поля ровно в тот момент, когда их заполняют.
   */
  useEffect(() => {
    const form = document.getElementById('estimate')
    if (!form || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      entries => setIsFormInView(entries.some(entry => entry.isIntersecting)),
      { rootMargin: '-10% 0px -10% 0px' }
    )
    observer.observe(form)
    return () => observer.disconnect()
  }, [])

  const scrollTo = useCallback((id: string) => {
    const node = document.getElementById(id)
    if (!node) return
    node.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const openEstimate = useCallback(
    (location: CtaLocation) => {
      trackMetrikaGoal('estimate_cta_click', { location })
      scrollTo('estimate')
    },
    [scrollTo]
  )

  const handleTaskSelect = useCallback(
    (task: TaskItem) => {
      trackMetrikaGoal('estimate_project_type', { project_type: task.projectType, source: 'tasks' })
      // Задача с собственной intent-страницей уводит на неё — там своя форма
      if (task.href) return
      setPresetProjectType(task.projectType)
      trackMetrikaGoal('estimate_cta_click', { location: 'middle' })
      scrollTo('estimate')
    },
    [scrollTo]
  )

  const handleCaseOpen = useCallback((slug: string) => {
    trackMetrikaGoal('commercial_case_open', { case_slug: slug })
  }, [])

  const handleVideoMilestone = useCallback(
    (milestone: 'start' | 'half' | 'complete', source: string) => {
      const goal =
        milestone === 'start'
          ? 'commercial_video_start'
          : milestone === 'half'
            ? 'commercial_video_50'
            : 'commercial_video_complete'
      trackMetrikaGoal(goal, { source })
    },
    []
  )

  const availableCaseSlugs = cases.map(item => item.slug)

  return (
    <main className="min-h-screen bg-[#000000] pb-20 md:pb-0">
      <TopBar />
      <JalousieMenu />

      <CommercialHero
        hero={content.hero}
        sla={content.sla}
        onEstimateClick={() => openEstimate('hero')}
        onProjectsClick={() => scrollTo('commercial-cases')}
      />

      <TrustStrip trust={content.trust} clients={clients} />

      <CommercialCases
        content={content.cases}
        cases={cases}
        onCaseOpen={handleCaseOpen}
        onVideoMilestone={handleVideoMilestone}
      />

      <TaskGrid content={content.tasks} onTaskSelect={handleTaskSelect} />

      <CommercialShowreel
        content={content.showreel}
        onVideoMilestone={milestone => handleVideoMilestone(milestone, 'showreel')}
      />

      <ProductionProcess content={content.process} />

      <PricingBands
        content={content.pricing}
        onEstimateClick={() => openEstimate('price')}
        onArticleClick={() => trackMetrikaGoal('estimate_cta_click', { location: 'price_article' })}
      />

      <WhySavage
        content={content.why}
        availableCaseSlugs={availableCaseSlugs}
        onCaseOpen={handleCaseOpen}
      />

      <EstimateForm
        content={content.estimate}
        success={content.success}
        presetProjectType={presetProjectType}
        onBookingClick={() => trackMetrikaGoal('booking_click', { location: 'estimate' })}
      />

      <CommercialFaq content={content.faq} />

      <FinalCta
        content={content.finalCta}
        onEstimateClick={() => openEstimate('final')}
        onEmailClick={() => trackMetrikaGoal('email_click', { location: 'final' })}
        onTelegramClick={() => trackMetrikaGoal('telegram_click', { location: 'final' })}
      />

      <StickyEstimateCta
        label={content.pricing.ctaLabel}
        onClick={() => openEstimate('sticky')}
        hidden={isFormInView}
      />

      <footer className="border-t border-[#1A1A1A] px-6 py-10 md:px-10 lg:px-20">
        <div className="flex flex-col items-start justify-between gap-4 text-sm text-white/40 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Savage Movie. Все права защищены.</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/projects" className="transition-colors hover:text-white">
              Проекты
            </Link>
            <Link href="/services" className="transition-colors hover:text-white">
              Услуги
            </Link>
            <Link href="/blog" className="transition-colors hover:text-white">
              Блог
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              Конфиденциальность
            </Link>
          </div>
          <span className="font-mono">Санкт-Петербург / Москва / Россия</span>
        </div>
      </footer>
    </main>
  )
}
