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

import { canOptimizePoster, normalizePosterUrl } from '@/lib/commercial-landing/poster-url'
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
  /**
   * Запасные адреса постера: если основной не загрузился (автопостер Bunny ещё не
   * сгенерирован и отвечает 404), загрузчик из <head> берёт следующий
   */
  fallbackPosterAlt?: string[]
  /** false: блок сейчас закрыт другим (стопка карточек), не грузить и не играть */
  active?: boolean
  /** Bunny id для HLS, когда у записи нет MP4 */
  streamId?: string | null
  /** Готовый MP4 (если нет записи в манифесте): прямой URL, один вариант на все экраны */
  mp4?: { desktop?: string; mobile?: string } | null
  /** sizes для постера из fallbackPoster; по умолчанию во всю ширину */
  fallbackSizes?: string
  /** Hero страницы: грузится сразу, не входит в лимит превью, постер с высоким приоритетом */
  hero?: boolean
  /**
   * Постер с высоким приоритетом, а видео остаётся по правилам карточки. Нужен
   * первой карточке списка: её кадр и есть LCP, и lazy-загрузка откладывала его
   * на секунду-две. По умолчанию следует за hero.
   */
  posterPriority?: boolean
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
  fallbackPosterAlt,
  active = true,
  streamId = null,
  mp4 = null,
  fallbackSizes = '100vw',
  hero = false,
  posterPriority = hero,
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

  /*
   * contain: вертикальная работа в горизонтальной рамке. Заливка LQIP и средний цвет
   * кадра тянулись бы на всю рамку и рисовали по бокам размытые цветные полосы.
   * Боковины должны быть цветом фона сайта, а LQIP остаётся только под самим кадром
   * (background-size: contain повторяет его раскладку).
   */
  const contained = fit === 'contain'
  const style = {
    ...(spec
      ? {
          backgroundColor: spec.color,
          backgroundImage: spec.lqip ? `url("${spec.lqip}")` : undefined,
        }
      : {}),
    ...(contained
      ? { '--sm-fit': 'contain', backgroundColor: 'var(--background)', backgroundSize: 'contain' }
      : {}),
  } as CSSProperties

  const altAttr = fallbackPosterAlt?.length ? fallbackPosterAlt.join('|') : undefined
  /*
   * В CMS у части работ в поле постера лежит анимированный preview.webp Bunny
   * (1–2 МБ). Постер обязан быть лёгким статичным кадром: иначе плитка 180 px
   * тянет мегабайты и отнимает канал у hero. normalizePosterUrl возвращает
   * thumbnail.jpg того же видео, next/image ужимает его под размер блока.
   */
  const staticPoster = fallbackPoster ? normalizePosterUrl(fallbackPoster) : null
  const poster = spec ? (
    <PosterPicture spec={spec} priority={posterPriority} />
  ) : staticPoster ? (
    canOptimizePoster(staticPoster) ? (
      <Image
        className="sm-poster-img"
        src={staticPoster}
        alt=""
        fill
        sizes={fallbackSizes}
        priority={posterPriority}
        draggable={false}
        data-sm-alt={altAttr}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="sm-poster-img sm-poster"
        src={staticPoster}
        alt=""
        decoding="async"
        loading={posterPriority ? 'eager' : 'lazy'}
        fetchPriority={posterPriority ? 'high' : 'auto'}
        draggable={false}
        data-sm-alt={altAttr}
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
      data-sm-active={active ? undefined : 'off'}
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
      suppressHydrationWarning
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
