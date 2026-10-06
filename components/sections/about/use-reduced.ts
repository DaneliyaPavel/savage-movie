'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Сниженное движение без расхождения с серверной разметкой: на сервере и в
 * первом проходе гидрации — false, настоящее значение приходит следующим
 * рендером. Разметка от настройки браузера не зависит, меняются лишь
 * диапазоны motion-значений и раскладка закреплённых сцен после монтирования.
 */
export function useReduced(): boolean {
  return useSyncExternalStore(
    notify => {
      const query = window.matchMedia(QUERY)
      query.addEventListener('change', notify)
      return () => query.removeEventListener('change', notify)
    },
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}

/** Мгновенное чтение для обработчиков событий */
export const reducedNow = () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
