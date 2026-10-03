'use client'

/**
 * Передаёт итоговые отчёты медиа-слоя в Яндекс Метрику (параметры визита).
 * Не рендерит ничего. Читает очередь window.__sm.events (то, что загрузчик
 * успел выпустить до гидратации) и подписывается на новые события.
 */
import { useEffect } from 'react'

import { METRIKA_ID } from '@/lib/analytics/metrika'
import { buildMetrikaParams, type MediaReport } from '@/lib/media/telemetry'

/** Не больше стольких разных поверхностей за визит: на /projects карточек десятки */
const MAX_SURFACES_PER_VISIT = 4

interface RawEvent {
  type: string
  name: string
  [key: string]: unknown
}

export function MediaRum() {
  useEffect(() => {
    const sent = new Set<string>()
    const names = new Set<string>()

    const send = (ev: RawEvent) => {
      if (ev.type !== 'report') return
      const report = ev as unknown as MediaReport & RawEvent
      const key = `${report.name}:${report.kind}`
      if (sent.has(key)) return
      if (!names.has(report.name)) {
        if (names.size >= MAX_SURFACES_PER_VISIT) return
        names.add(report.name)
      }
      sent.add(key)
      const params = buildMetrikaParams(report, navigator.userAgent)
      if (!params || typeof window.ym !== 'function') return
      try {
        window.ym(METRIKA_ID, 'params', params)
      } catch {
        /* телеметрия не должна ломать страницу */
      }
    }

    const sm = (window as unknown as { __sm?: { events: RawEvent[] } }).__sm
    sm?.events.forEach(send)

    const onEvent = (e: Event) => send((e as CustomEvent<RawEvent>).detail)
    window.addEventListener('savage:media', onEvent)
    return () => window.removeEventListener('savage:media', onEvent)
  }, [])

  return null
}
