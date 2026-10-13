'use client'

/**
 * Синхронное воспроизведение пары «до / после»: два <video> одного размера и одной длины
 * играют как один. Шов режет кадр пополам, поэтому рука или губы, ушедшие на два кадра,
 * видны сразу.
 *
 * Контракт разметки (корень — элемент, на который указывает ref):
 *   video[data-pair-side="before"|"after"]  без src и с preload="none": адрес ставит хук или, на первом
 *                                           экране, ранний скрипт (pair-early.ts)
 *   data-src-d / data-src-m                 MP4 для десктопа и мобильного (MOBILE_MEDIA_QUERY)
 * Состояние пишется в root.dataset.pairState:
 *   poster  — ничего не качается (reduced-motion, Save-Data, 2g) или ещё не начали
 *   loading — файлы качаются, на экране постеры
 *   live    — оба видео играют вровень, CSS открывает их поверх постеров
 *   failed  — ошибка источника, автозапуск отклонён: остаётся постер
 *
 * Постер вырезан из нулевого кадра того же MP4 (scripts/media/build-compare-pairs.mjs), поэтому
 * переход «постер → видео» без скачка. Видео открывается, только когда оба играют и разница
 * во времени меньше полутора кадров.
 *
 * Ведущее — «после». Каждые 200 мс «до» подтягивается к нему: небольшой разбег лечится
 * скоростью воспроизведения, большой — перемоткой. Если одно видео остановилось на буферизации,
 * второе ждёт его, а не убегает вперёд. Вне экрана и в скрытой вкладке оба стоят.
 */
import { useEffect, type RefObject } from 'react'

import { MOBILE_MEDIA_QUERY } from './config'

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'
const SYNC_INTERVAL_MS = 200
/** Полтора кадра при 24 к/с */
const HARD_SEEK_S = 0.0625
const SOFT_SEEK_S = 0.012
const START_TIMEOUT_MS = 12000
/** Файлы второй пары небольшие: качаем заранее, за полтора экрана, чтобы к приходу видео уже играло */
const NEAR_MARGIN = '150% 0px'

export interface PairPlaybackOptions {
  /** hero: начать сразу после монтирования; иначе — когда блок подошёл к экрану */
  eager?: boolean
}

type PairState = 'poster' | 'loading' | 'live' | 'failed'

interface NetworkInformation {
  saveData?: boolean
  effectiveType?: string
}

function constrainedNetwork(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
  if (!connection) return false
  return connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType ?? '')
}

export function usePairPlayback(
  rootRef: RefObject<HTMLElement | null>,
  { eager = false }: PairPlaybackOptions = {}
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const before = root.querySelector<HTMLVideoElement>('video[data-pair-side="before"]')
    const after = root.querySelector<HTMLVideoElement>('video[data-pair-side="after"]')
    if (!before || !after) return

    const setState = (state: PairState) => {
      root.dataset.pairState = state
    }
    setState('poster')

    const reducedQuery = window.matchMedia(REDUCED_QUERY)
    if (reducedQuery.matches || constrainedNetwork()) return

    const videos = [before, after]
    const mobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches
    let disposed = false
    let started = false
    let wantStart = false
    let live = false
    let inView = true
    let timer = 0
    let startTimeout = 0
    let observer: IntersectionObserver | null = null
    let nearObserver: IntersectionObserver | null = null

    const runnable = () => !disposed && inView && !document.hidden && !reducedQuery.matches
    const bothReady = () => videos.every(video => video.readyState >= 3)
    const bothPaused = () => videos.every(video => video.paused)

    const fail = () => {
      if (disposed) return
      stop()
      setState('failed')
    }

    // Шов с каждым циклом перескакивает на «0»: разницу через границу петли не считаем разрывом
    const drift = () => {
      const length = after.duration
      let diff = before.currentTime - after.currentTime
      if (Number.isFinite(length) && length > 0) {
        if (diff > length / 2) diff -= length
        else if (diff < -length / 2) diff += length
      }
      return diff
    }

    const align = () => {
      if (Math.abs(drift()) > SOFT_SEEK_S / 2) before.currentTime = after.currentTime
      before.playbackRate = 1
    }

    const playBoth = () => {
      align()
      Promise.all(videos.map(video => video.play())).then(
        () => undefined,
        () => {
          // Автозапуск не дали (экономия заряда, политика браузера): остаёмся на постере
          if (!live) fail()
        }
      )
    }

    const pauseBoth = () => {
      for (const video of videos) if (!video.paused) video.pause()
    }

    const tick = () => {
      if (disposed || !started) return
      if (!runnable()) {
        pauseBoth()
        return
      }
      if (!bothReady()) {
        // Одно видео догружается: второе ждёт его, иначе пара разойдётся
        pauseBoth()
        return
      }
      if (bothPaused()) {
        playBoth()
        return
      }
      const diff = drift()
      if (Math.abs(diff) > HARD_SEEK_S) {
        before.currentTime = after.currentTime
        before.playbackRate = 1
      } else if (Math.abs(diff) > SOFT_SEEK_S) {
        // Небольшой разбег лечится скоростью: перемотка видна как рывок
        before.playbackRate = 1 - Math.max(-0.05, Math.min(0.05, diff * 1.5))
      } else if (before.playbackRate !== 1) {
        before.playbackRate = 1
      }
      if (!live && after.currentTime > 0.08 && Math.abs(diff) <= HARD_SEEK_S) {
        live = true
        window.clearTimeout(startTimeout)
        setState('live')
      }
    }

    const onWaiting = () => tick()

    function stop() {
      window.clearInterval(timer)
      window.clearTimeout(startTimeout)
      observer?.disconnect()
      nearObserver?.disconnect()
      for (const video of videos) {
        video.removeEventListener('canplay', tick)
        video.removeEventListener('waiting', onWaiting)
        video.removeEventListener('error', fail)
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }

    const begin = () => {
      // Качать можно и вне экрана (вторая пара стартует за полтора экрана); играть — только на экране
      if (disposed || started || reducedQuery.matches) return
      if (document.hidden) {
        // Вкладка открыта в фоне: старт ждёт, пока её покажут
        wantStart = true
        return
      }
      started = true
      setState('loading')
      for (const video of videos) {
        const src = mobile ? video.dataset.srcM : video.dataset.srcD
        if (!src) {
          fail()
          return
        }
        video.addEventListener('canplay', tick)
        video.addEventListener('waiting', onWaiting)
        video.addEventListener('error', fail)
        // Ранний скрипт (pair-early.ts) мог уже поставить адрес: перезапуск обнулил бы загрузку
        if (video.getAttribute('src') !== src) {
          video.preload = 'auto'
          video.src = src
          video.load()
        } else if (video.readyState >= 3) {
          tick()
        }
      }
      timer = window.setInterval(tick, SYNC_INTERVAL_MS)
      // Нет первого кадра за 12 с: остаёмся постером и отпускаем сеть
      startTimeout = window.setTimeout(() => {
        if (!live) fail()
      }, START_TIMEOUT_MS)
    }

    const onVisibility = () => {
      if (wantStart && !started && !document.hidden) begin()
      else tick()
    }
    const onReduced = () => {
      if (reducedQuery.matches) {
        stop()
        setState('poster')
        started = false
        live = false
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    reducedQuery.addEventListener('change', onReduced)

    if (typeof IntersectionObserver === 'undefined') {
      begin()
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return
          inView = entry.isIntersecting
          if (inView) tick()
          else pauseBoth()
        },
        { threshold: 0.05 }
      )
      observer.observe(root)
    }

    if (eager) {
      // Первый экран: ждать load нечего, постер уже на месте, а ролики могли начать качаться раньше
      begin()
    } else if (typeof IntersectionObserver !== 'undefined') {
      nearObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            nearObserver?.disconnect()
            begin()
          }
        },
        { rootMargin: NEAR_MARGIN }
      )
      nearObserver.observe(root)
    }

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibility)
      reducedQuery.removeEventListener('change', onReduced)
      stop()
    }
  }, [rootRef, eager])
}
