/**
 * Одна сторона пары «до / после»: постер в HTML и видео без src поверх него.
 *
 * Постер приходит вместе с разметкой (AVIF → JPEG, свой кадр для телефона и десктопа) и держит
 * LCP; видео стартует, только когда usePairPlayback подтвердил, что обе стороны играют вровень
 * (lib/media/use-pair-playback.ts). Корень пары получает data-pair-state, CSS открывает видео
 * в состоянии live.
 */
import { MOBILE_MEDIA_QUERY } from '@/lib/media/config'
import type { PairSideSpec } from '@/lib/media/compare-pairs'

import './pair-layer.css'

interface PairLayerProps {
  side: 'before' | 'after'
  spec: PairSideSpec
  /** Кадр первого экрана: eager и fetchpriority=high */
  priority?: boolean
  /** Ширина кадра на экране для выбора из srcset; по умолчанию во всю ширину окна */
  sizes?: string
}

interface PairPosterProps {
  spec: PairSideSpec
  priority?: boolean
  sizes?: string
  /** Кадр всегда 16:9, даже на телефоне: для карточек, где вертикальный кроп не подходит */
  wide?: boolean
  imgClassName?: string
}

/** Постер стороны пары: AVIF → JPEG, свой кадр для телефона и для десктопа */
export function PairPoster({
  spec,
  priority = false,
  sizes = '100vw',
  wide = false,
  imgClassName,
}: PairPosterProps) {
  const { desktop, mobile } = spec
  return (
    <picture className="dir-pair-poster" style={{ backgroundColor: desktop.color }}>
      {wide ? null : (
        <>
          <source
            media={MOBILE_MEDIA_QUERY}
            type="image/avif"
            srcSet={mobile.posterAvif}
            sizes={sizes}
          />
          <source media={MOBILE_MEDIA_QUERY} srcSet={mobile.posterJpeg} sizes={sizes} />
        </>
      )}
      <source type="image/avif" srcSet={desktop.posterAvif} sizes={sizes} />
      <img
        src={desktop.posterJpeg}
        width={desktop.width}
        height={desktop.height}
        alt=""
        className={imgClassName}
        decoding={priority ? 'sync' : 'async'}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
      />
    </picture>
  )
}

export function PairLayer({ side, spec, priority = false, sizes = '100vw' }: PairLayerProps) {
  const { desktop, mobile } = spec
  return (
    <>
      <PairPoster spec={spec} priority={priority} sizes={sizes} />
      <video
        className="dir-pair-video"
        data-pair-side={side}
        data-src-d={desktop.video}
        data-src-m={mobile.video}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  )
}
