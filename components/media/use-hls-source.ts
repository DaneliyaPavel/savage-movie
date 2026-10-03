'use client'

/**
 * Подключает HLS к уже отрисованному <video> через единую фабрику
 * (lib/media/hls-controller.ts) и гарантированно разбирает при размонтировании
 * или смене источника. Для плееров с контролами (useCase 'player') и для
 * унаследованных компонентов, которым нужен только «источник под <video>».
 *
 * Показом (постер → видео) хук не управляет: это делает MotionSurface.
 */
import { useEffect, type RefObject } from 'react'

import { createHlsController, type HlsUseCase } from '@/lib/media/hls-controller'

interface UseHlsSourceOptions {
  /** Полный URL playlist.m3u8; пустая строка или null — ничего не делаем */
  src: string | null | undefined
  useCase: HlsUseCase
  /** false — источник не подключается (ленивая загрузка) */
  enabled?: boolean
  onFatal?: (reason: string) => void
}

export function useHlsSource(
  videoRef: RefObject<HTMLVideoElement | null>,
  { src, useCase, enabled = true, onFatal }: UseHlsSourceOptions
): void {
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src || !enabled) return

    let cancelled = false
    let destroy: (() => void) | null = null

    createHlsController(video, {
      src,
      useCase,
      containerSize: () => ({
        width: video.clientWidth,
        height: video.clientHeight,
      }),
      onFatal,
    })
      .then(controller => {
        if (cancelled) controller.destroy()
        else destroy = () => controller.destroy()
      })
      .catch(() => onFatal?.('init'))

    return () => {
      cancelled = true
      destroy?.()
    }
    // onFatal намеренно вне зависимостей: смена колбэка не должна пересоздавать поток
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, src, useCase, enabled])
}
