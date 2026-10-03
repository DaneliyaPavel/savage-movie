'use client'

/**
 * true, когда hero страницы определился: показан, не удался или выключен
 * (reduced-motion, Save-Data). До этого момента второстепенное движение —
 * анимированные плитки ленты — не должно отнимать канал у первого экрана.
 *
 * На сервере и в первом клиентском рендере false, поэтому HTML всегда
 * содержит статичные кадры. Страховочный таймер нужен на случай, если
 * загрузчик заблокирован расширением: плитки не должны ждать вечно.
 */
import { useSyncExternalStore } from 'react'

const FAILSAFE_MS = 7000

let failsafeElapsed = false

function subscribe(onChange: () => void): () => void {
  const timer = window.setTimeout(() => {
    failsafeElapsed = true
    onChange()
  }, FAILSAFE_MS)
  window.addEventListener('sm:hero-settled', onChange)
  return () => {
    window.clearTimeout(timer)
    window.removeEventListener('sm:hero-settled', onChange)
  }
}

function getSnapshot(): boolean {
  const sm = (window as unknown as { __sm?: { settled: boolean } }).__sm
  return failsafeElapsed || sm?.settled === true
}

export function useHeroSettled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
