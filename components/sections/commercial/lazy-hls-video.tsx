/**
 * Видео коммерческого лендинга и направлений: постер сразу, движение — по делу.
 *
 * Лендинг насыщен видео, и четыре потока, стартующие при первом рендере,
 * съедают LCP и мобильный трафик до того, как человек доскроллит до кейсов.
 * Поэтому у компонента два режима:
 *
 *   фон / карточка (без controls) — единая медиа-поверхность (components/media):
 *     постер приходит в HTML, видео подключает загрузчик из <head> только когда
 *     поверхность нужна: фоновый луп (autoPlay) — рядом с вьюпортом; карточка
 *     (autoPlay=false) — по наведению мыши, на таче движения нет вовсе. Видео
 *     проявляется поверх постера, когда первый кадр показан и запаса буфера
 *     хватает; одновременно не больше двух превью;
 *
 *   плеер (controls) — постер, видео с контролами, hls.js через общую фабрику
 *     и только когда блок подошёл к вьюпорту; при prefers-reduced-motion
 *     автозапуска нет.
 *
 * Публичный API компонента прежний: страницы и тесты его не замечают.
 */
'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import Image from 'next/image'

import { MotionSurface } from '@/components/media/motion-surface'
import { useMediaSpec } from '@/components/media/media-specs-context'
import { useHlsSource } from '@/components/media/use-hls-source'
import { canOptimizePoster } from '@/lib/commercial-landing/poster-url'
import { getStreamUrl, getThumbnailUrl } from '@/lib/integrations/bunny/client'
import { cn } from '@/lib/utils'

export interface LazyHlsVideoProps {
  playbackId: string
  /** Свой постер; по умолчанию берётся кадр Bunny */
  poster?: string | null
  /** Фоновый луп: без звука, зациклен, стартует сам */
  loop?: boolean
  /**
   * true — фоновый луп (грузится рядом с вьюпортом); false без controls —
   * карточка, оживающая по наведению мыши.
   */
  autoPlay?: boolean
  controls?: boolean
  className?: string
  /** Соотношение сторон контейнера — фиксируем, чтобы не ловить layout shift */
  aspect?: string
  /** Доступное имя для скринридера и подпись для поиска */
  title?: string
  /** Прогресс просмотра: старт, половина, досмотр. Каждое событие — один раз */
  onProgressMilestone?: (milestone: 'start' | 'half' | 'complete') => void
  /** Постер не откладывается до приближения к вьюпорту */
  eager?: boolean
  /**
   * Постер — LCP страницы: fetchpriority=high, видео грузится сразу. По
   * умолчанию совпадает с eager. На странице такой блок один: второй
   * priority не ускоряет второй кадр, он замедляет первый.
   */
  priority?: boolean
  /** sizes для постера; по умолчанию — полноширинный блок (hero, showreel) */
  sizes?: string
  /**
   * Играет ли этот блок прямо сейчас. Сохранён ради совместимости: движением
   * в режиме фона управляет загрузчик по видимости поверхности (вышла из кадра —
   * пауза, вернулась — продолжение), а лимит одновременных превью не даёт
   * нескольким сценам качать потоки сразу.
   */
  active?: boolean
  /** Медиазапрос: видео оживает, только пока он выполняется (блок только для десктопа) */
  onlyWhen?: string
}

function useMilestones(
  containerRef: RefObject<HTMLElement | null>,
  onProgressMilestone: LazyHlsVideoProps['onProgressMilestone']
) {
  const marksRef = useRef({ start: false, half: false, complete: false })

  useEffect(() => {
    const video = containerRef.current?.querySelector('video')
    if (!video || !onProgressMilestone) return

    const onTime = () => {
      const marks = marksRef.current
      if (!marks.start && video.currentTime > 0.5) {
        marks.start = true
        onProgressMilestone('start')
      }
      if (!marks.half && video.duration > 0 && video.currentTime / video.duration >= 0.5) {
        marks.half = true
        onProgressMilestone('half')
      }
    }
    const onEnded = () => {
      const marks = marksRef.current
      if (marks.complete) return
      marks.complete = true
      onProgressMilestone('complete')
    }
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('ended', onEnded)
    }
  }, [containerRef, onProgressMilestone])
}

function SurfaceVariant({
  playbackId,
  poster,
  loop = false,
  autoPlay = false,
  className,
  aspect = '16 / 9',
  title,
  onProgressMilestone,
  eager = false,
  priority = eager,
  sizes = '100vw',
  onlyWhen,
}: LazyHlsVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spec = useMediaSpec(playbackId)
  useMilestones(containerRef, onProgressMilestone)

  const posterUrl = poster || getThumbnailUrl(playbackId)

  return (
    <div
      ref={containerRef}
      title={title}
      className={cn('relative overflow-hidden bg-[#0A0A0A]', className)}
      style={{ aspectRatio: aspect }}
    >
      <MotionSurface
        name={priority ? 'landing-hero' : autoPlay ? 'landing-loop' : 'landing-card'}
        spec={spec}
        streamId={playbackId}
        fallbackPoster={posterUrl || null}
        fallbackSizes={sizes}
        hero={priority}
        play={autoPlay ? 'auto' : 'hover-only'}
        hoverScope={autoPlay ? undefined : '.group'}
        onlyWhen={onlyWhen}
        loop={loop || autoPlay}
        className="absolute inset-0"
      />
    </div>
  )
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function PlayerVariant({
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
  priority = eager,
  sizes = '100vw',
  active = true,
}: LazyHlsVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isNear, setIsNear] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const posterUrl = poster || getThumbnailUrl(playbackId)

  // Первое условие: блок подошёл к вьюпорту
  useEffect(() => {
    const node = containerRef.current
    if (!node || isNear) return

    if (typeof IntersectionObserver === 'undefined') {
      // без наблюдателя считаем блок близким; не синхронно, чтобы не плодить каскад рендеров
      queueMicrotask(() => setIsNear(true))
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

  // Второе условие: видео действительно нужно играть. Флаг залипающий: снимать
  // его значило бы размонтировать <video> и мигать постером при каждом возврате.
  // Производное состояние выставляется прямо в рендере (так рекомендует React),
  // а не в эффекте: лишнего прохода рендера нет
  if (!shouldLoad && isNear && active && (autoPlay || controls)) setShouldLoad(true)

  // Единая фабрика: стратегия, буфер, retry и destroy в одном месте
  useHlsSource(videoRef, {
    src: playbackId ? getStreamUrl(playbackId) : null,
    useCase: 'player',
    enabled: shouldLoad,
  })

  // Автозапуск — только если пользователь не просил уменьшить движение и
  // только пока сцена действительно на экране
  useEffect(() => {
    if (!shouldLoad || !autoPlay) return
    const video = videoRef.current
    if (!video || prefersReducedMotion()) return

    if (!active) {
      video.pause()
      return
    }

    const play = () => {
      // Браузер вправе отклонить автозапуск — это не ошибка, остаётся постер
      void video.play().catch(() => undefined)
    }

    if (video.readyState >= 2) play()
    else video.addEventListener('canplay', play, { once: true })

    return () => video.removeEventListener('canplay', play)
  }, [shouldLoad, autoPlay, active])

  useMilestones(containerRef, onProgressMilestone)

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-[#0A0A0A]', className)}
      style={{ aspectRatio: aspect }}
    >
      {/* Постер остаётся под видео: он же первый кадр и он же фолбэк,
          если автозапуск отклонён или поток не поднялся */}
      {posterUrl ? (
        canOptimizePoster(posterUrl) ? (
          <Image
            src={posterUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : eager ? 'eager' : 'lazy'}
            className={cn(
              'object-cover transition-opacity duration-[var(--motion-media)] ease-[var(--ease-out-expo)]',
              isPlaying ? 'opacity-0' : 'opacity-100'
            )}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt=""
            aria-hidden="true"
            loading={eager || priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-[var(--motion-media)] ease-[var(--ease-out-expo)]',
              isPlaying ? 'opacity-0' : 'opacity-100'
            )}
          />
        )
      ) : null}

      {shouldLoad ? (
        <video
          ref={videoRef}
          /* poster-атрибут пуст, когда кадр уже нарисован оптимизированным слоем выше */
          poster={posterUrl && !canOptimizePoster(posterUrl) ? posterUrl : undefined}
          muted
          loop={loop}
          playsInline
          preload="metadata"
          controls={controls}
          title={title}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </div>
  )
}

export function LazyHlsVideo(props: LazyHlsVideoProps) {
  return props.controls ? <PlayerVariant {...props} /> : <SurfaceVariant {...props} />
}
