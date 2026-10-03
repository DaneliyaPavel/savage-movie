/**
 * Постер, который отдаёт сервер: <picture> с AVIF/WebP/JPEG и отдельными
 * кадрами для мобильного и десктопа. Браузер находит его в HTML сразу, ещё до
 * JS, и это LCP страницы. Кадр взят из нулевого кадра итогового MP4
 * (scripts/media/build-web-video.mjs), поэтому видео проявляется поверх него
 * без скачка.
 *
 * Серверный компонент: ни хуков, ни состояния.
 */
import { MOBILE_MEDIA_QUERY } from '@/lib/media/config'
import type { MediaSurfaceSpec } from '@/lib/media/manifest'
import { cn } from '@/lib/utils'

interface PosterPictureProps {
  spec: MediaSurfaceSpec
  /** Кадр первого экрана: eager и fetchpriority=high */
  priority?: boolean
  className?: string
}

export function PosterPicture({ spec, priority = false, className }: PosterPictureProps) {
  const { desktop, mobile } = spec.poster
  return (
    <picture className={cn('sm-poster', className)}>
      {mobile.sources.map(source => (
        <source
          key={`m-${source.type}`}
          media={MOBILE_MEDIA_QUERY}
          type={source.type}
          srcSet={source.srcSet}
          sizes="100vw"
        />
      ))}
      <source media={MOBILE_MEDIA_QUERY} srcSet={mobile.src} />
      {desktop.sources.map(source => (
        <source key={`d-${source.type}`} type={source.type} srcSet={source.srcSet} sizes="100vw" />
      ))}
      <img
        className="sm-poster-img"
        src={desktop.src}
        width={desktop.width}
        height={desktop.height}
        alt=""
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
      />
    </picture>
  )
}
