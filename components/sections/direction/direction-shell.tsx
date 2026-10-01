/**
 * Каркас страницы направления: шапка, меню, бриф, футер и цели Метрики.
 *
 * Всё, что не должно различаться от страницы к странице, живёт здесь: форма
 * заявки (та же, что на /reklamny-rolik и /services — одна реализация
 * антиспама, атрибуции и конверсии), sticky-CTA, атрибуция рекламного клика,
 * размеченный направлением бриф. Композиция страницы приходит как children.
 *
 * Контракты для страниц:
 *  - data-sticky-hide на любом элементе страницы — пока он на экране,
 *    плавающая кнопка сметы скрыта (плюс форма #estimate и финал #direction-end);
 *    значение "desktop" — только от md (на телефоне кнопка остаётся полосой внизу);
 *  - .dir-paper-section (или data-header-theme="light") на светлой секции —
 *    шапка сама переключается на тёмный знак, пока секция под ней;
 *  - main получает .dir-shell: position: relative, скрим под шапкой и единое
 *    начертание плавающей кнопки (direction-kit.css).
 */
'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { MotionConfig } from 'framer-motion'

import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { useMenu } from '@/components/ui/menu-context'
import { SiteFooter } from '@/components/sections/site-footer'
import { EstimateForm } from '@/components/sections/commercial/estimate-form'
import { StickyEstimateCta } from '@/components/sections/commercial/sticky-estimate-cta'
import { useReveal } from '@/components/sections/clients/use-reveal'

import { captureAttribution } from '@/lib/analytics/attribution'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { DEFAULT_COMMERCIAL_LANDING } from '@/lib/commercial-landing/content'
import { SERVICES_BRIEF, SERVICES_BRIEF_SUCCESS } from '@/lib/services/brief'
import type { ServiceDirectionId } from '@/lib/services/directions'
import { cn } from '@/lib/utils'
import { DirectionPageContext, type DirectionPageApi } from './direction-context'

import './direction-kit.css'

/** Высота мягкой кромки светлой секции: совпадает с --dir-edge в direction-kit.css */
const EDGE_PX = 40

/** Узлы, на которых плавающая кнопка сметы прячется */
const STICKY_HIDE_TARGETS = '#estimate, #direction-end, [data-sticky-hide]'

/** Светлые секции: над ними шапке нужен тёмный знак */
const LIGHT_SECTIONS = '.dir-paper-section, [data-header-theme="light"]'

/**
 * Следит за узлами по селектору внутри корня: отдаёт набор сразу и снова —
 * когда в дерево добавили подходящий узел (страница может смонтировать блок
 * позже первого рендера). Перебор дерева — только на добавлении узла, не на
 * каждой смене текста таймкода; пересбор сводится к одному кадру.
 */
function watchNodes(
  root: HTMLElement,
  selector: string,
  onChange: (nodes: HTMLElement[]) => void
): () => void {
  const collect = () => onChange(Array.from(root.querySelectorAll<HTMLElement>(selector)))
  collect()
  if (typeof MutationObserver === 'undefined') return () => undefined

  let frame = 0
  const observer = new MutationObserver(records => {
    if (frame) return
    const relevant = records.some(record =>
      Array.from(record.addedNodes).some(
        node =>
          node instanceof HTMLElement && (node.matches(selector) || node.querySelector(selector))
      )
    )
    if (!relevant) return
    frame = requestAnimationFrame(() => {
      frame = 0
      collect()
    })
  })
  observer.observe(root, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    if (frame) cancelAnimationFrame(frame)
  }
}

/** Приводит набор наблюдаемых узлов к актуальному: новые берёт, пропавшие отпускает */
function syncObserved(
  observer: IntersectionObserver,
  observed: Set<Element>,
  nodes: readonly Element[],
  visible: Set<Element>
) {
  const alive = new Set<Element>(nodes)
  observed.forEach(node => {
    if (alive.has(node)) return
    observer.unobserve(node)
    observed.delete(node)
    visible.delete(node)
  })
  alive.forEach(node => {
    if (observed.has(node)) return
    observer.observe(node)
    observed.add(node)
  })
}

/**
 * Шапка сайта на страницах направлений.
 *
 * TopBar общий и прозрачный: он падает то на кадр, то на заголовок, то на
 * светлую секцию. Компонент не меняется — каркас даёт ему три вещи:
 *  1. скрим под шапкой (после первых 48px прокрутки; на самом верху чистый кадр);
 *  2. тёмный знак и «МЕНЮ» над светлой секцией — через уже существующее
 *     состояние headerDark, которое переключается по полосе вдоль центра шапки,
 *     равной кромке секции: смена происходит там, где бумага уже проявилась;
 *  3. атрибуты data-header и data-scrolled на main, по которым CSS красит скрим
 *     без перерисовки страницы.
 * Значение headerDark пишется только на смене, поэтому страницы, которые ещё
 * ведут его сами, не спорят с каркасом.
 */
function DirectionHeader({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const { headerDark, setHeaderDark } = useMenu()

  useEffect(() => {
    const root = rootRef.current
    if (root) root.dataset.header = headerDark ? 'light' : 'dark'
  }, [headerDark, rootRef])

  // Сторож на первых 48px страницы: ушёл с экрана — шапка получает скрим
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

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const inside = new Set<Element>()
    const observed = new Set<Element>()
    let nodes: HTMLElement[] = []
    let observer: IntersectionObserver | null = null
    let applied = false
    let frame = 0

    const apply = () => {
      const dark = inside.size > 0
      if (dark === applied) return
      applied = dark
      setHeaderDark(dark)
    }

    const build = () => {
      observer?.disconnect()
      inside.clear()
      observed.clear()
      // Центр шапки считаем по разметке, а не по getBoundingClientRect: на входе
      // шапка едет (topbar-reveal), и её прямоугольник в этот момент смещён
      const header = root.querySelector<HTMLElement>('header')
      const center = header && header.offsetHeight > 0 ? header.offsetHeight / 2 : 34
      const top = Math.max(0, Math.round(center - EDGE_PX / 2))
      const bottom = Math.max(0, Math.round(window.innerHeight - center - EDGE_PX / 2))
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) inside.add(entry.target)
            else inside.delete(entry.target)
          }
          apply()
        },
        { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0 }
      )
      // apply() здесь не зовём: наблюдатель сам пришлёт текущее состояние, а
      // промежуточное «пусто» на ресайзе мигнуло бы шапкой над бумагой
      syncObserved(observer, observed, nodes, inside)
    }

    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(build)
    }

    const stop = watchNodes(root, LIGHT_SECTIONS, found => {
      nodes = found
      if (observer) {
        syncObserved(observer, observed, nodes, inside)
        apply()
      }
    })
    build()
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      observer?.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      if (applied) setHeaderDark(false)
    }
  }, [rootRef, setHeaderDark])

  return (
    <>
      <span
        aria-hidden="true"
        data-header-sentinel=""
        className="pointer-events-none absolute left-0 top-0 h-12 w-px"
      />
      <span aria-hidden="true" data-tone="dark" className="dir-header-scrim" />
      <span aria-hidden="true" data-tone="light" className="dir-header-scrim" />
    </>
  )
}

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

  // Sticky-CTA не нужен, когда на экране форма, финальный CTA страницы или
  // любой элемент с data-sticky-hide (закреплённая сцена, свой призыв, плюс
  // вопроса): он закрывал бы поля и дублировал бы главную кнопку
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<Element>()
    const observed = new Set<Element>()
    // data-sticky-hide="desktop" действует от md: на телефоне кнопка — полоса
    // внизу, она не лежит поверх элементов списков
    const wide = window.matchMedia('(min-width: 48rem)')
    const isBlocking = (node: Element) =>
      (node as HTMLElement).dataset.stickyHide !== 'desktop' || wide.matches
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
    const stop = watchNodes(root, STICKY_HIDE_TARGETS, nodes => {
      syncObserved(observer, observed, nodes, visible)
      update()
    })
    wide.addEventListener('change', update)
    return () => {
      stop()
      wide.removeEventListener('change', update)
      observer.disconnect()
    }
  }, [rootRef])

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
        <main
          ref={rootRef}
          className={cn(
            'dir-shell relative',
            className ?? 'min-h-screen bg-[#000000] pb-20 md:pb-0'
          )}
        >
          <TopBar />
          <JalousieMenu />
          <DirectionHeader rootRef={rootRef} />

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
