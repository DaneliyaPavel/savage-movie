'use client'

import { LazyHlsVideo } from '@/components/sections/commercial/lazy-hls-video'
import { cn } from '@/lib/utils'
import type { DirectionWork } from '@/lib/services/proof'

/**
 * Кадр сцены.
 *
 * Тонкая обёртка над общей видеоабстракцией сайта: она уже умеет постер
 * первым, отложенную загрузку hls.js, фиксированное соотношение сторон и
 * отказ от автозапуска при prefers-reduced-motion. Здесь добавлено ровно две
 * вещи: честный фолбэк на статичный кадр, когда у работы нет потока, и
 * передача active — на странице из семи полноэкранных сцен играть должна
 * только та, что на экране.
 */
export interface SceneMediaProps {
  work: DirectionWork
  /** Сцена сейчас на экране: только тогда поднимается поток */
  active: boolean
  /** Соотношение сторон контейнера — фиксируем, чтобы не ловить сдвиг вёрстки */
  aspect?: string
  className?: string
  sizes?: string
  /** Кадр первого экрана: постер грузится с приоритетом */
  eager?: boolean
}

export function SceneMedia({
  work,
  active,
  aspect = '16 / 9',
  className,
  sizes = '100vw',
  eager = false,
}: SceneMediaProps) {
  const title = `${work.client} — ${work.title}`

  if (work.playbackId) {
    return (
      <LazyHlsVideo
        playbackId={work.playbackId}
        poster={work.posterUrl}
        autoPlay
        loop
        active={active}
        aspect={aspect}
        sizes={sizes}
        eager={eager}
        title={title}
        className={className}
      />
    )
  }

  if (!work.posterUrl) return null

  return (
    <div
      className={cn('relative overflow-hidden bg-[#0A0A0A]', className)}
      style={{ aspectRatio: aspect }}
    >
      {/* Обычный img, а не next/image: постер может прийти из CMS произвольным
          внешним адресом, которого нет в remotePatterns — оптимизатор на таком
          падает с ошибкой конфигурации, а кадр важнее экономии байтов.
          eslint-disable-next-line @next/next/no-img-element */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={work.posterUrl}
        alt={title}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}
