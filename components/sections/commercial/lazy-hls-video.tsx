/**
 * Видео коммерческого лендинга: постер сразу, поток — по приближении к экрану.
 *
 * Лендинг насыщен видео, и четыре HLS-потока, стартующие при первом рендере,
 * съедают LCP и мобильный трафик до того, как человек вообще доскроллит до
 * кейсов. Поэтому здесь:
 *   — постер лежит в <img> и рисуется первым, размер контейнера задан заранее
 *     (aspect-ratio), поэтому подгрузка видео не двигает вёрстку;
 *   — hls.js подгружается динамическим импортом и только когда блок и подошёл
 *     к вьюпорту, и действительно должен играть. Одного приближения мало:
 *     hls.js начинает качать сегменты сразу после attach, и четыре карточки
 *     кейсов молча выкачивали бы четыре потока, которые никто не смотрит;
 *   — при prefers-reduced-motion автозапуска нет: фоновый луп для такого
 *     пользователя остаётся картинкой, пока он сам не нажмёт play.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type Hls from 'hls.js'

import { getStreamUrl, getThumbnailUrl } from '@/lib/integrations/bunny/client'
import { cn } from '@/lib/utils'

export interface LazyHlsVideoProps {
  playbackId: string
  /** Свой постер; по умолчанию берётся кадр Bunny */
  poster?: string | null
  /** Фоновый луп: без звука, зациклен, стартует сам */
  loop?: boolean
  autoPlay?: boolean
  controls?: boolean
  className?: string
  /** Соотношение сторон контейнера — фиксируем, чтобы не ловить layout shift */
  aspect?: string
  /** Доступное имя для скринридера и подпись для поиска */
  title?: string
  /** Прогресс просмотра: старт, половина, досмотр. Каждое событие — один раз */
  onProgressMilestone?: (milestone: 'start' | 'half' | 'complete') => void
  /** Постер грузится с priority: только для медиа первого экрана */
  eager?: boolean
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function LazyHlsVideo({
  playbackId,
  poster,
  loop = false,
  autoPlay = false,
  controls = false,
  className,
  aspect = '16 / 9',
  title,
  onProgressMilestone,
  eager = false,
}: LazyHlsVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const milestonesRef = useRef({ start: false, half: false, complete: false })

  const [isNear, setIsNear] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const posterUrl = poster || getThumbnailUrl(playbackId)

  // Первое условие: блок подошёл к вьюпорту
  useEffect(() => {
    const node = containerRef.current
    if (!node || isNear) return

    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setIsNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isNear])

  /**
   * Второе условие: видео действительно нужно играть — фоновый луп, наведение
   * на карточку кейса или плеер с управлением. До этого момента карточка живёт
   * одним постером; на мобильных, где наведения не бывает, поток не грузится
   * вовсе — там тап уводит на страницу кейса.
   *
   * Флаг залипающий: снимать его на mouseleave значило бы размонтировать
   * <video> и мигать постером при каждом повторном наведении.
   */
  useEffect(() => {
    if (shouldLoad) return
    if (isNear && (autoPlay || controls)) setShouldLoad(true)
  }, [isNear, autoPlay, controls, shouldLoad])

  useEffect(() => {
    if (!shouldLoad) return
    const video = videoRef.current
    if (!video || !playbackId) return

    const src = getStreamUrl(playbackId)
    if (!src) return

    let cancelled = false

    const attach = async () => {
      // Safari играет HLS нативно — hls.js там только лишний вес
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        return
      }

      const { default: HlsPlayer } = await import('hls.js')
      if (cancelled || !HlsPlayer.isSupported()) return

      const hls = new HlsPlayer({
        enableWorker: true,
        capLevelToPlayerSize: true,
        startLevel: -1,
        maxBufferLength: 20,
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      hlsRef.current = hls
    }

    void attach()

    return () => {
      cancelled = true
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [shouldLoad, playbackId])

  // Автозапуск фонового лупа — только если пользователь не просил уменьшить движение
  useEffect(() => {
    if (!shouldLoad || !autoPlay) return
    const video = videoRef.current
    if (!video || prefersReducedMotion()) return

    const play = () => {
      // Браузер вправе отклонить автозапуск — это не ошибка, остаётся постер
      void video.play().catch(() => undefined)
    }

    if (video.readyState >= 2) play()
    else video.addEventListener('canplay', play, { once: true })

    return () => video.removeEventListener('canplay', play)
  }, [shouldLoad, autoPlay])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || !onProgressMilestone) return

    const marks = milestonesRef.current
    if (!marks.start && video.currentTime > 0.5) {
      marks.start = true
      onProgressMilestone('start')
    }
    if (!marks.half && video.duration > 0 && video.currentTime / video.duration >= 0.5) {
      marks.half = true
      onProgressMilestone('half')
    }
  }, [onProgressMilestone])

  const handleEnded = useCallback(() => {
    const marks = milestonesRef.current
    if (marks.complete || !onProgressMilestone) return
    marks.complete = true
    onProgressMilestone('complete')
  }, [onProgressMilestone])

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-[#0A0A0A]', className)}
      style={{ aspectRatio: aspect }}
    >
      {/* Постер остаётся под видео: он же первый кадр и он же фолбэк,
          если автозапуск отклонён или поток не поднялся */}
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            isPlaying ? 'opacity-0' : 'opacity-100'
          )}
        />
      ) : null}

      {shouldLoad ? (
        <video
          ref={videoRef}
          poster={posterUrl || undefined}
          muted
          loop={loop}
          playsInline
          preload="metadata"
          controls={controls}
          title={title}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </div>
  )
}
