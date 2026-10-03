/**
 * Единая медиа-поверхность Savage Movie: постер + видео поверх него.
 *
 * Серверный компонент. Разметка целиком приходит в HTML:
 *   — <picture> с постером (LCP, виден до любого JS);
 *   — <video> без src: источник назначает загрузчик из <head> по размеру
 *     экрана (десктоп/мобайл), поэтому лишний вариант не скачивается и старт
 *     не ждёт гидратации;
 *   — корень с data-sm-*: контракт описан в lib/media/boot/boot.ts.
 *
 * Если для видео нет MP4-превью в манифесте, но есть Bunny id, источником
 * служит HLS через StreamDriver. Если нет и его, остаётся честный постер.
 */
import type { CSSProperties } from 'react'
import Image from 'next/image'

import { canOptimizePoster } from '@/lib/commercial-landing/poster-url'
import { normalizeVideoId } from '@/lib/integrations/bunny/client'
import { MOBILE_MEDIA_QUERY } from '@/lib/media/config'
import type { MediaSurfaceSpec } from '@/lib/media/manifest'
import { cn } from '@/lib/utils'

import { PosterPicture } from './poster-picture'
import { StreamDriver } from './stream-driver'

export interface MotionSurfaceProps {
  /** Имя в телеметрии: showreel, project-card, project-hero, … */
  name: string
  /** Запись манифеста: постеры и MP4. Без неё работает fallbackPoster + streamId */
  spec?: MediaSurfaceSpec | null
  /** Постер, когда записи в манифесте нет (кадр из CMS или Bunny) */
  fallbackPoster?: string | null
  /** Bunny id для HLS, когда у записи нет MP4 */
  streamId?: string | null
  /** Готовый MP4 (если нет записи в манифесте): прямой URL, один вариант на все экраны */
  mp4?: { desktop?: string; mobile?: string } | null
  /** sizes для постера из fallbackPoster; по умолчанию во всю ширину */
  fallbackSizes?: string
  /** Hero страницы: грузится сразу, не входит в лимит превью, постер с высоким приоритетом */
  hero?: boolean
  /**
   * auto: фоновые лупы; hover: карточки (мышь — наведение, тач — видимость);
   * hover-only: на таче движения нет вовсе (мобильный трафик Директа не оплачивает лупы)
   */
  play?: 'auto' | 'hover' | 'hover-only'
  /** Медиазапрос: поверхность оживает, только пока он выполняется (блок только для десктопа) */
  onlyWhen?: string
  /** CSS-селектор ближайшего предка, над которым ловится наведение (карточка целиком, а не только кадр) */
  hoverScope?: string
  /** object-fit постера и видео; contain для вертикальных работ в горизонтальной рамке */
  fit?: 'cover' | 'contain'
  /** Не начинать, пока hero страницы не определился (показан, упал или выключен) */
  afterHero?: boolean
  /** CSS-селектор: не показывать видео, пока такой элемент в DOM (заставка) */
  holdUntil?: string
  /** Запас буфера до показа, секунд (1.5–3) */
  bufferSeconds?: number
  loop?: boolean
  className?: string
}

export function MotionSurface({
  name,
  spec = null,
  fallbackPoster = null,
  streamId = null,
  mp4 = null,
  fallbackSizes = '100vw',
  hero = false,
  play = 'auto',
  onlyWhen,
  hoverScope,
  fit = 'cover',
  afterHero = false,
  holdUntil,
  bufferSeconds,
  loop = true,
  className,
}: MotionSurfaceProps) {
  const mp4D = spec?.mp4.desktop ?? mp4?.desktop
  const mp4M = spec?.mp4.mobile ?? mp4?.mobile
  // Админка хранит видео то голым id, то ссылкой плеера: драйверу нужен id
  const rawStream = !mp4D && !mp4M ? (streamId ?? spec?.streamId ?? null) : null
  const stream = rawStream ? normalizeVideoId(rawStream) : null
  const hasVideo = Boolean(mp4D || mp4M || stream)

  const style = {
    ...(spec
      ? {
          backgroundColor: spec.color,
          backgroundImage: spec.lqip ? `url("${spec.lqip}")` : undefined,
        }
      : {}),
    ...(fit === 'contain' ? { '--sm-fit': 'contain' } : {}),
  } as CSSProperties

  const poster = spec ? (
    <PosterPicture spec={spec} priority={hero} />
  ) : fallbackPoster ? (
    canOptimizePoster(fallbackPoster) ? (
      <Image
        className="sm-poster-img"
        src={fallbackPoster}
        alt=""
        fill
        sizes={fallbackSizes}
        priority={hero}
        draggable={false}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="sm-poster-img sm-poster"
        src={fallbackPoster}
        alt=""
        decoding="async"
        loading={hero ? 'eager' : 'lazy'}
        fetchPriority={hero ? 'high' : 'auto'}
        draggable={false}
      />
    )
  ) : null

  if (!hasVideo) {
    return (
      <div className={cn('sm-root', className)} style={style} data-sm-name={name}>
        {poster}
      </div>
    )
  }

  return (
    <div
      className={cn('sm-root', className)}
      style={style}
      data-sm=""
      data-sm-name={name}
      data-sm-state="poster"
      data-sm-want="0"
      data-sm-src-d={mp4D}
      data-sm-src-m={mp4M}
      data-sm-stream={stream ?? undefined}
      data-sm-mq={MOBILE_MEDIA_QUERY}
      data-sm-load={hero ? 'eager' : 'near'}
      data-sm-play={play}
      data-sm-only={onlyWhen}
      data-sm-hover-scope={hoverScope}
      data-sm-buffer={bufferSeconds}
      data-sm-hero={hero ? '' : undefined}
      data-sm-after={afterHero ? 'hero' : undefined}
      data-sm-hold-until={holdUntil}
      data-sm-loop={loop ? undefined : 'off'}
    >
      {poster}
      <video
        className="sm-video"
        muted
        playsInline
        loop={loop}
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        suppressHydrationWarning
      />
      {stream ? <StreamDriver videoId={stream} /> : null}
    </div>
  )
}
