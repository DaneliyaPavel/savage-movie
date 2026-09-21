'use client'

import { useState } from 'react'
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
  /**
   * Кадр грузится сразу, не дожидаясь приближения к вьюпорту. Это НЕ
   * приоритет: браузер просто не откладывает запрос.
   */
  eager?: boolean
  /**
   * LCP страницы. Ставит <link rel=preload> и fetchpriority=high — то есть
   * забирает канал у всего остального. На странице такой кадр ровно один;
   * второй priority не ускоряет второй кадр, а замедляет первый.
   */
  priority?: boolean
  /**
   * Точка кадра, которая обязана остаться в рамке. На телефоне
   * полноэкранный слот режет горизонтальный кадр до центральной трети, и
   * лицо, стоящее не по центру, из кадра уезжает.
   */
  objectPosition?: string
  /**
   * Кадр в разметке, но не на экране: так beauty держит все четыре материала
   * загруженными и раскодированными заранее, а переключение остаётся склейкой.
   */
  hidden?: boolean
}

export function SceneMedia({
  work,
  active,
  aspect = '16 / 9',
  className,
  sizes = '100vw',
  eager = false,
  priority = false,
  objectPosition,
  hidden = false,
}: SceneMediaProps) {
  const title = `${work.client} — ${work.title}`
  /*
   * Постер может не приехать: в CMS остаются ссылки на файлы, которых уже нет,
   * а прокси CDN отвечает 502. Браузер в этом случае рисует поверх композиции
   * значок битой картинки и альтернативный текст — то есть ровно посреди
   * финального кадра появляется строка «Biotherm — Молекула воды» служебным
   * шрифтом. Вместо этого остаётся поверхность сцены, геометрия не меняется,
   * а имя работы уходит в скринридер.
   */
  const [failed, setFailed] = useState(false)

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
        eager={eager || priority}
        priority={priority}
        title={title}
        /* Поверхность под видео — та же, что у сцены. Раньше контейнер
           красился в #0A0A0A: на чёрной странице #0D0D0D это прямоугольник
           на три единицы темнее, который видно ровно до первого кадра */
        className={cn('bg-[#0D0D0D]', className)}
      />
    )
  }

  if (!work.posterUrl) return null

  const poster = work.posterUrl

  return (
    <div
      className={cn('relative overflow-hidden bg-[#0D0D0D]', hidden && 'opacity-0', className)}
      aria-hidden={hidden ? true : undefined}
      style={{ aspectRatio: aspect }}
    >
      {failed ? (
        <span className="sr-only">{title}</span>
      ) : canOptimizePoster(poster) ? (
        <Image
          src={poster}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : eager ? 'eager' : 'lazy'}
          quality={75}
          onError={() => setFailed(true)}
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
          loading={eager || priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
          style={objectPosition ? { objectPosition } : undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
