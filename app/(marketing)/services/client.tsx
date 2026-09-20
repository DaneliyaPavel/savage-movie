/**
 * Клиентская сборка раздела направлений.
 *
 * Страница — не каталог услуг, а монтаж: семь коммерческих территорий идут
 * подряд полноэкранными сценами, и в каждый момент главная ровно одна. Здесь
 * живёт то, что требует браузера: какая сцена сейчас активна, какое медиа
 * играет, что уходит в Метрику и с каким направлением открывается бриф.
 *
 * Сам контент сцен приходит с сервера готовым — заголовки, копия, кадры и
 * ссылки на работы попадают в HTML первого ответа, без ожидания гидратации.
 */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'

import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SiteFooter } from '@/components/sections/site-footer'
import { EstimateForm } from '@/components/sections/commercial/estimate-form'

import { ServicesHero } from '@/components/sections/services/services-hero'
import { SceneIndex } from '@/components/sections/services/scene-index'
import { SceneCommercial } from '@/components/sections/services/scene-commercial'
import { SceneFashion } from '@/components/sections/services/scene-fashion'
import { SceneBeauty } from '@/components/sections/services/scene-beauty'
import { SceneContent } from '@/components/sections/services/scene-content'
import { SceneCorporate } from '@/components/sections/services/scene-corporate'
import { SceneAi } from '@/components/sections/services/scene-ai'
import { SceneMusic } from '@/components/sections/services/scene-music'
import { ServicesFinal, SERVICES_OUTRO_ID } from '@/components/sections/services/services-final'
import { useActiveScene } from '@/components/sections/services/use-active-scene'
import { useReveal } from '@/components/sections/clients/use-reveal'
import type { SceneProps } from '@/components/sections/services/scene-props'

import { captureAttribution } from '@/lib/analytics/attribution'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { SERVICES_BRIEF, SERVICES_BRIEF_SUCCESS } from '@/lib/services/brief'
import { DEFAULT_COMMERCIAL_LANDING } from '@/lib/commercial-landing/content'
import type { ResolvedDirection } from '@/lib/services/proof'
import type { DirectionWork } from '@/lib/services/proof'
import type { ServiceDirectionId } from '@/lib/services/directions'

/** Сцена каждого направления. Композиции разные — общий здесь только контракт */
const SCENES: Record<ServiceDirectionId, (props: SceneProps) => React.ReactElement> = {
  commercial: SceneCommercial,
  fashion: SceneFashion,
  beauty: SceneBeauty,
  'content-production': SceneContent,
  corporate: SceneCorporate,
  ai: SceneAi,
  music: SceneMusic,
}

/** Белая инверсия ритма. Два экрана из семи — больше перестало бы быть сломом */
const LIGHT_SCENES = new Set<ServiceDirectionId>(['fashion', 'corporate'])

/**
 * Направления, у которых в технической строке стоит ориентир бюджета.
 * Только для них имеет смысл цель service_price_view: в остальных сценах
 * справа стоят доказательства, а не деньги.
 */
const PRICED_SCENES = new Set<ServiceDirectionId>(['commercial', 'content-production'])

const sceneId = (direction: { id: string }) => `scene-${direction.id}`

export interface ServicesPageClientProps {
  directions: ResolvedDirection[]
  montage: DirectionWork[]
}

export function ServicesPageClient({ directions, montage }: ServicesPageClientProps) {
  /*
   * Выход из монтажа наблюдается наравне со сценами. Без него индекс,
   * удерживающий последнюю активную сцену, продолжал бы висеть над финальным
   * экраном и над брифом и уверять, что человек всё ещё в музыкальном клипе.
   */
  const sceneIds = useMemo(() => [...directions.map(sceneId), SERVICES_OUTRO_ID], [directions])
  const activeId = useActiveScene(sceneIds)

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

  const activeDirection = useMemo(
    () => directions.find(direction => sceneId(direction) === activeId) ?? null,
    [directions, activeId]
  )

  // Просмотр направления засчитываем по факту того, что сцена стала главной
  // на экране, а не по факту пересечения нижней кромки: иначе быстрый скролл
  // насчитал бы все семь направлений за две секунды.
  useEffect(() => {
    if (!activeDirection) return
    if (seenRef.current.has(activeDirection.id)) return
    seenRef.current.add(activeDirection.id)

    trackMetrikaGoal('service_direction_view', { service: activeDirection.id })
    if (PRICED_SCENES.has(activeDirection.id)) {
      trackMetrikaGoal('service_price_view', { service: activeDirection.id })
    }
  }, [activeDirection])

  const scrollToBrief = useCallback(() => {
    const node = document.getElementById('estimate')
    if (!node) return
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const handleBrief = useCallback(
    (direction: ResolvedDirection) => {
      trackMetrikaGoal('service_direction_click', {
        service: direction.id,
        destination: 'brief',
      })
      trackMetrikaGoal('service_brief_open', { service: direction.id })
      setBriefDirection(direction.id)
      scrollToBrief()
    },
    [scrollToBrief]
  )

  const handleNavigate = useCallback((direction: ResolvedDirection) => {
    trackMetrikaGoal('service_direction_click', {
      service: direction.id,
      destination: 'landing',
    })
  }, [])

  const handleCaseOpen = useCallback((direction: ResolvedDirection, slug: string) => {
    trackMetrikaGoal('service_case_open', { service: direction.id, case_slug: slug })
  }, [])

  /**
   * Появление заголовков сцен. Механика общая с /clients и /projects: атрибут
   * состояния и CSS-переход вместо второй системы анимации, только transform,
   * контент всегда в DOM и всегда видим.
   */
  const revealRef = useReveal<HTMLElement>()

  const indexTheme =
    activeDirection && LIGHT_SCENES.has(activeDirection.id)
      ? ('white' as const)
      : ('black' as const)

  return (
    <MotionConfig reducedMotion="user">
      <main ref={revealRef} className="min-h-screen bg-[#0D0D0D]">
        <TopBar />
        <JalousieMenu />

        <ServicesHero
          eyebrow="SAVAGE MOVIE / PRODUCTION DIRECTIONS / SPB + MOSCOW"
          title="Какую задачу нужно снять?"
          lead="Реклама, fashion, beauty, corporate, AI и регулярный контент. Сначала задача. Камера потом."
          montage={montage}
          scrollHint="Листайте — семь направлений подряд"
        />

        <SceneIndex
          directions={directions}
          activeId={activeDirection ? activeId : null}
          sceneId={sceneId}
          theme={indexTheme}
        />

        {directions.map(direction => {
          const Scene = SCENES[direction.id]
          const id = sceneId(direction)

          return (
            <Scene
              key={direction.id}
              id={id}
              direction={direction}
              active={activeId === id}
              onBrief={handleBrief}
              onNavigate={handleNavigate}
              onCaseOpen={handleCaseOpen}
            />
          )
        })}

        <ServicesFinal
          onBriefClick={() => {
            trackMetrikaGoal('service_brief_open', { service: 'none' })
            scrollToBrief()
          }}
          onEmailClick={() => trackMetrikaGoal('email_click', { location: 'services_final' })}
          onTelegramClick={() => trackMetrikaGoal('telegram_click', { location: 'services_final' })}
        />

        {/*
          Бриф — та же форма, что собирает заявки на коммерческой посадочной,
          со своим набором первых вопросов. Своя копия формы здесь означала бы
          вторую реализацию антиспама, атрибуции, вложения брифа и конверсии —
          и неизбежное расхождение между ними.
        */}
        <EstimateForm
          content={SERVICES_BRIEF}
          success={SERVICES_BRIEF_SUCCESS}
          sla={DEFAULT_COMMERCIAL_LANDING.sla}
          presetProjectType={briefDirection}
          serviceDirection={briefDirection}
          onBookingClick={() => trackMetrikaGoal('booking_click', { location: 'services_brief' })}
        />

        <SiteFooter />
      </main>
    </MotionConfig>
  )
}

export default ServicesPageClient
