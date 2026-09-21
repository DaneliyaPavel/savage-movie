/**
 * Клиентская сборка раздела направлений.
 *
 * Раздел устроен не как страница из секций, а как одна сцена, которая меняет
 * состояние. Каждая территория — высокий контейнер с залипающим в нём экраном;
 * положение внутри контейнера задаёт геометрию: раскрытие колонок в fashion,
 * приближение кадра в beauty, деление мастер-кадра на восемь в регулярном
 * продакшне, движение шва в AI. Поэтому здесь нет ни одной общей композиции —
 * общим остался только контракт сцены.
 *
 * Тут живёт только то, что требует браузера: какая территория сейчас на
 * экране, какое видео имеет право играть, что уходит в Метрику и с каким
 * направлением открывается бриф. Заголовки, копия, названия брендов и ссылки
 * на работы приходят с сервера готовыми.
 */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'framer-motion'

import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SiteFooter } from '@/components/sections/site-footer'
import { EstimateForm } from '@/components/sections/commercial/estimate-form'

import { ServicesHero } from '@/components/sections/services/services-hero'
import { ProductionIndex } from '@/components/sections/services/production-index'
import { StageCommercial } from '@/components/sections/services/stage-commercial'
import { StageFashion } from '@/components/sections/services/stage-fashion'
import { StageBeauty } from '@/components/sections/services/stage-beauty'
import { StageContent } from '@/components/sections/services/stage-content'
import { StageCorporate } from '@/components/sections/services/stage-corporate'
import { StageAi } from '@/components/sections/services/stage-ai'
import { StageMusic } from '@/components/sections/services/stage-music'
import {
  ServicesEndFrame,
  SERVICES_OUTRO_ID,
} from '@/components/sections/services/services-endframe'
import { ServicesSpec } from '@/components/sections/services/services-spec'
import { useActiveScene } from '@/components/sections/services/use-active-scene'
import type { SceneProps } from '@/components/sections/services/scene-props'

import { captureAttribution } from '@/lib/analytics/attribution'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { SERVICES_BRIEF, SERVICES_BRIEF_SUCCESS } from '@/lib/services/brief'
import { DEFAULT_COMMERCIAL_LANDING } from '@/lib/commercial-landing/content'
import type { DirectionWork, ResolvedDirection } from '@/lib/services/proof'
import type { ServiceDirectionId } from '@/lib/services/directions'

/**
 * Сцена территории. У каждой своя метафора взаимодействия — удар, индекс,
 * приближение, размножение, сборка пространства, шов, доля. Общий здесь
 * только контракт: это и есть разница с прежней версией, где семь территорий
 * были семью настройками одного компонента.
 */
const STAGES: Record<ServiceDirectionId, (props: SceneProps) => React.ReactElement> = {
  commercial: StageCommercial,
  fashion: StageFashion,
  beauty: StageBeauty,
  'content-production': StageContent,
  corporate: StageCorporate,
  ai: StageAi,
  music: StageMusic,
}

/** Белая инверсия ритма. Две из семи — больше перестало бы быть сломом */
const LIGHT_STAGES = new Set<ServiceDirectionId>(['fashion', 'corporate'])

/**
 * Территории, у которых в технической строке стоит ориентир бюджета. Только
 * для них имеет смысл цель service_price_view: в остальных справа стоят
 * доказательства, а не деньги.
 */
const PRICED_STAGES = new Set<ServiceDirectionId>(['commercial', 'content-production'])

const sceneId = (direction: { id: string }) => `scene-${direction.id}`

export interface ServicesPageClientProps {
  directions: ResolvedDirection[]
  montage: DirectionWork[]
  /** Кадр выхода: выбран раскадровкой, а не взят из монтажа */
  closing: DirectionWork | null
}

export function ServicesPageClient({ directions, montage, closing }: ServicesPageClientProps) {
  /*
   * Выход наблюдается наравне с территориями. Без него головка таймлайна,
   * удерживающая последнюю активную сцену, продолжала бы висеть над брифом и
   * уверять, что человек всё ещё в музыкальном клипе.
   */
  const sceneIds = useMemo(() => [...directions.map(sceneId), SERVICES_OUTRO_ID], [directions])
  const activeId = useActiveScene(sceneIds)

  /** Направление, с которым открыт бриф: становится первым ответом формы */
  const [briefDirection, setBriefDirection] = useState<string | null>(null)

  const viewTrackedRef = useRef(false)
  /** Территории, просмотр которых уже засчитан: цель шлётся один раз за визит */
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

  // Просмотр засчитываем по факту того, что территория стала главной на
  // экране, а не по пересечению нижней кромки: иначе быстрая прокрутка
  // насчитала бы все семь направлений за две секунды.
  useEffect(() => {
    if (!activeDirection) return
    if (seenRef.current.has(activeDirection.id)) return
    seenRef.current.add(activeDirection.id)

    trackMetrikaGoal('service_direction_view', { service: activeDirection.id })
    if (PRICED_STAGES.has(activeDirection.id)) {
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

  const indexTheme =
    activeDirection && LIGHT_STAGES.has(activeDirection.id)
      ? ('white' as const)
      : ('black' as const)

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
          title="Какую задачу нужно снять?"
          lead="Сначала задача. Камера потом."
          montage={montage}
        />

        <ProductionIndex
          directions={directions}
          activeId={activeDirection ? activeId : null}
          sceneId={sceneId}
          theme={indexTheme}
        />

        {directions.map(direction => {
          const Stage = STAGES[direction.id]
          const id = sceneId(direction)

          return (
            <Stage
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
