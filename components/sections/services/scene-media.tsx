'use client'

import Image from 'next/image'

import { LazyHlsVideo } from '@/components/sections/commercial/lazy-hls-video'
import { canOptimizePoster } from '@/lib/commercial-landing/poster-url'
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
 *
 * Статичный кадр проходит через тот же оптимизатор, что и постер видео.
 * Раньше эта ветка всегда рисовала исходник, и это было незаметно ровно до
 * тех пор, пока сцены брали первый кадр галереи: у него случайно оказался
 * лёгкий webp. Выбранные планы — исходники CMS на три, пять и восемь
 * мегабайт, и без оптимизатора выбор кадра пришлось бы делать не по тому,
 * какой из них сильнее, а по тому, какой легче.
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
  /**
   * Точка кадра, которая обязана остаться в рамке. На телефоне
   * полноэкранный слот режет горизонтальный кадр до центральной трети, и
   * лицо, стоящее не по центру, из кадра уезжает.
   */
  objectPosition?: string
}

export function SceneMedia({
  work,
  active,
  aspect = '16 / 9',
  className,
  sizes = '100vw',
  eager = false,
  objectPosition,
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

  const poster = work.posterUrl

  return (
    <div
      className={cn('relative overflow-hidden bg-[#0A0A0A]', className)}
      style={{ aspectRatio: aspect }}
    >
      {canOptimizePoster(poster) ? (
        <Image
          src={poster}
          alt={title}
          fill
          sizes={sizes}
          priority={eager}
          quality={75}
          style={objectPosition ? { objectPosition } : undefined}
          className="object-cover"
        />
      ) : (
        /* Произвольный внешний адрес из CMS: оптимизатор на таком падает с
           ошибкой конфигурации, а кадр важнее экономии байтов.
           eslint-disable-next-line @next/next/no-img-element */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          style={objectPosition ? { objectPosition } : undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
