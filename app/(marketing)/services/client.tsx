/**
 * Клиентская сборка раздела направлений.
 *
 * Первый экран — монтаж кадров, дальше стопка из семи карточек
 * направлений (раскрываются от прокрутки), бриф и спецификация. Раньше каждое направление было отдельной
 * залипающей сценой на полтора-два экрана прокрутки; ролл показывает все
 * семь сразу и оставляет прокрутку обычной.
 *
 * Тут живёт только то, что требует браузера: какое направление раскрыто,
 * что уходит в Метрику и с каким направлением открывается бриф. Заголовки,
 * копия, названия брендов и ссылки на работы приходят с сервера готовыми.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'

import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SiteFooter } from '@/components/sections/site-footer'
import { EstimateForm } from '@/components/sections/commercial/estimate-form'

import { ServicesHero } from '@/components/sections/services/services-hero'
import { ServicesEndFrame } from '@/components/sections/services/services-endframe'
import { ServicesSpec } from '@/components/sections/services/services-spec'
import { DirectionCards } from '@/components/sections/services/direction-cards'

import { captureAttribution } from '@/lib/analytics/attribution'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { SERVICES_BRIEF, SERVICES_BRIEF_SUCCESS } from '@/lib/services/brief'
import { DEFAULT_COMMERCIAL_LANDING } from '@/lib/commercial-landing/content'
import type { DirectionWork, ResolvedDirection } from '@/lib/services/proof'
import type { ServiceDirectionId } from '@/lib/services/directions'

/**
 * Территории, у которых в технической строке стоит ориентир бюджета. Только
 * для них имеет смысл цель service_price_view: в остальных справа стоят
 * доказательства, а не деньги.
 */
const PRICED_STAGES = new Set<ServiceDirectionId>(['commercial', 'content-production'])

export interface ServicesPageClientProps {
  directions: ResolvedDirection[]
  montage: DirectionWork[]
  /** Кадр выхода: выбран раскадровкой, а не взят из монтажа */
  closing: DirectionWork | null
  /** Поток шоурила, как в hero главной; пусто — карточки показывают кадры работ */
  showreelId?: string
}

export function ServicesPageClient({
  directions,
  montage,
  closing,
  showreelId,
}: ServicesPageClientProps) {
  /** Направление, с которым открыт бриф: становится первым ответом формы */
  const [briefDirection, setBriefDirection] = useState<string | null>(null)

  const viewTrackedRef = useRef(false)
  /** Направления, просмотр которых уже засчитан: цель шлётся один раз за визит */
  const seenRef = useRef(new Set<string>())

  useEffect(() => {
    captureAttribution()
    if (viewTrackedRef.current) return
    viewTrackedRef.current = true
    trackMetrikaGoal('service_page_view')
  }, [])

  // Просмотр засчитываем, когда направление стало главным в сцене, а не когда
  // сцена появилась: быстрая прокрутка не должна насчитывать все семь.
  const handleOpen = useCallback((direction: ResolvedDirection) => {
    if (seenRef.current.has(direction.id)) return
    seenRef.current.add(direction.id)

    trackMetrikaGoal('service_direction_view', { service: direction.id })
    if (PRICED_STAGES.has(direction.id)) {
      trackMetrikaGoal('service_price_view', { service: direction.id })
    }
  }, [])

  const scrollToBrief = useCallback(() => {
    const node = document.getElementById('estimate')
    if (!node) return
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const handleBrief = useCallback(
    (direction: ResolvedDirection) => {
      trackMetrikaGoal('service_direction_click', { service: direction.id, destination: 'brief' })
      trackMetrikaGoal('service_brief_open', { service: direction.id })
      setBriefDirection(direction.id)
      scrollToBrief()
    },
    [scrollToBrief]
  )

  const handleNavigate = useCallback((direction: ResolvedDirection) => {
    trackMetrikaGoal('service_direction_click', { service: direction.id, destination: 'landing' })
  }, [])

  const handleCaseOpen = useCallback((direction: ResolvedDirection, slug: string) => {
    trackMetrikaGoal('service_case_open', { service: direction.id, case_slug: slug })
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-[#0D0D0D]">
        <TopBar />
        <JalousieMenu />

        {/*
          В надзаголовке осталось то, чего нет в самом заголовке: сколько
          территорий и где мы их снимаем. Имя студии оттуда убрано — оно стоит
          в шапке двумя сантиметрами выше, и повторять его строкой ниже значит
          представляться дважды.
        */}
        <ServicesHero
          eyebrow="СЕМЬ НАПРАВЛЕНИЙ / САНКТ-ПЕТЕРБУРГ + МОСКВА"
          title="Что будем снимать?"
          lead="Рекламу, коллекцию, продукт или клип. Ниже — работы по каждому направлению."
          montage={montage}
        />

        <DirectionCards
          directions={directions}
          showreelId={showreelId}
          onOpen={handleOpen}
          onBrief={handleBrief}
          onNavigate={handleNavigate}
          onCaseOpen={handleCaseOpen}
        />

        <ServicesEndFrame
          closing={closing}
          onBriefClick={() => {
            trackMetrikaGoal('service_brief_open', { service: 'none' })
            scrollToBrief()
          }}
          onEmailClick={() => trackMetrikaGoal('email_click', { location: 'services_final' })}
          onTelegramClick={() => trackMetrikaGoal('telegram_click', { location: 'services_final' })}
        />

        {/*
          Бриф — та же форма, что собирает заявки на коммерческой посадочной,
          со своим набором первых вопросов. Своя копия формы означала бы вторую
          реализацию антиспама, атрибуции, вложения брифа и конверсии — и
          неизбежное расхождение между ними.
        */}
        <EstimateForm
          content={SERVICES_BRIEF}
          success={SERVICES_BRIEF_SUCCESS}
          sla={DEFAULT_COMMERCIAL_LANDING.sla}
          presetProjectType={briefDirection}
          serviceDirection={briefDirection}
          onBookingClick={() => trackMetrikaGoal('booking_click', { location: 'services_brief' })}
        />

        {/* Рациональный слой: то, что кадр не обязан объяснять словами */}
        <ServicesSpec
          directions={directions}
          onCaseOpen={handleCaseOpen}
          onNavigate={handleNavigate}
        />

        <SiteFooter />
      </main>
    </MotionConfig>
  )
}

export default ServicesPageClient
