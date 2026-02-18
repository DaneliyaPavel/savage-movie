'use client'

import type { CardCoverSettings } from '@/features/courses/api'
import { VideoPlayer } from '@/features/projects/components/VideoPlayer'
import { cn } from '@/lib/utils'

function getMuxPlaybackId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/mux\.com\/([^/?]+)/)
  return m?.[1] ?? null
}

const DEFAULT_ACCENT = 'rgba(59, 130, 246, 0.35)'

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return hex ? `rgba(0,0,0,${alpha})` : DEFAULT_ACCENT
  const m = hex.slice(1).match(/.{2}/g)
  if (!m) return DEFAULT_ACCENT
  const [r, g, b] = m.map(x => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

const NOISE_DATA_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

const BADGE_DOT_COLORS: Record<string, { bg: string; shadow: string }> = {
  online: { bg: '#00e5ff', shadow: '0 0 8px rgba(0, 229, 255, 0.6)' },
  offline: { bg: '#f59e0b', shadow: '0 0 8px rgba(245, 158, 11, 0.6)' },
  hybrid: { bg: '#a78bfa', shadow: '0 0 8px rgba(167, 139, 250, 0.6)' },
  'online+live': { bg: '#00e5ff', shadow: '0 0 8px rgba(0, 229, 255, 0.6)' },
}
const DEFAULT_BADGE_DOT = { bg: '#00e5ff', shadow: '0 0 8px rgba(0, 229, 255, 0.6)' }
const FORMAT_LABELS: Record<string, string> = {
  online: 'Онлайн',
  offline: 'Офлайн',
  hybrid: 'Гибрид',
  'online+live': 'Онлайн + живые',
}

function getBadgeDotStyle(
  format: string | null | undefined,
  customHex: string | null | undefined
): { bg: string; shadow: string } {
  if (customHex && customHex.startsWith('#')) {
    const shadowRgba = hexToRgba(customHex, 0.6)
    return { bg: customHex, shadow: `0 0 8px ${shadowRgba}` }
  }
  return BADGE_DOT_COLORS[format ?? ''] ?? DEFAULT_BADGE_DOT
}

export interface CourseCoverProps {
  settings?: CardCoverSettings | null
  coverImage?: string | null
  /** Video URL for card cover (e.g. video_promo_url); used when coverMediaType === 'video' */
  coverVideoUrl?: string | null
  /** 'video' = show video on card, else show image */
  coverMediaType?: 'image' | 'video' | null
  className?: string
  /** Optional badge text overlay on cover */
  badgeText?: string | null
  /** Format (online/offline) for badge dot color */
  format?: string | null
}

export function CourseCover({
  settings,
  coverImage,
  coverVideoUrl,
  coverMediaType,
  className,
  badgeText,
  format,
}: CourseCoverProps) {
  const accent1 = hexToRgba(settings?.accent1, 0.3)
  const accent2 = hexToRgba(settings?.accent2, 0.28)
  const accent3 = hexToRgba(settings?.accent3, 0.18)
  const noOverlay = settings?.no_overlay ?? false
  const showGrid = noOverlay ? false : (settings?.show_grid ?? true)
  const showNoise = noOverlay ? false : (settings?.show_noise ?? true)
  const showScanlines = noOverlay ? false : (settings?.show_scanlines ?? false)
  const showOrbs = noOverlay ? false : (settings?.show_orbs ?? true)
  const showFrameCorners = noOverlay ? false : (settings?.show_frame_corners ?? false)
  const showPlayIcon = noOverlay ? false : (settings?.show_play_icon ?? false)
  const overlayStrength = settings?.overlay_strength ?? 'medium'

  const overlayOpacity =
    overlayStrength === 'high' ? 0.7 : overlayStrength === 'medium' ? 0.45 : 0.25

  const useVideo = coverMediaType === 'video' && coverVideoUrl
  const muxPlaybackId = useVideo ? getMuxPlaybackId(coverVideoUrl) : null

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('relative w-full overflow-hidden rounded-t-xl bg-[var(--background)]', className)}
      style={{ aspectRatio: '16/9', minHeight: 180 }}
    >
      {/* Cover media: video (muted, loop) or image behind mesh */}
      {useVideo && muxPlaybackId && (
        <div className="absolute inset-0 z-0">
          <VideoPlayer
            playbackId={muxPlaybackId}
            title=""
            muted
            loop
            autoplay
            controls={false}
            objectFit="cover"
            className="h-full w-full [&_video]:object-cover"
          />
        </div>
      )}
      {useVideo && !muxPlaybackId && typeof coverVideoUrl === 'string' && (
        <div className="absolute inset-0 z-0">
          <video
            src={coverVideoUrl}
            muted
            loop
            playsInline
            autoPlay
            className="h-full w-full object-cover"
            aria-hidden
          />
        </div>
      )}
      {!useVideo && coverImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={coverImage}
            alt=""
            className={cn('h-full w-full object-cover', noOverlay ? 'opacity-100' : 'opacity-40')}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      )}

      {/* Mesh gradients */}
      {!noOverlay && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `
            radial-gradient(ellipse 55% 45% at 15% 85%, ${accent1} 0%, transparent 65%),
            radial-gradient(ellipse 50% 55% at 88% 15%, ${accent2} 0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 50% 50%, ${accent3} 0%, transparent 55%)
          `,
          }}
        />
      )}

      {/* Grid overlay */}
      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 15%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 15%, transparent 75%)',
          }}
        />
      )}

      {/* Noise */}
      {showNoise && (
        <div
          className="pointer-events-none absolute inset-0 z-[3] opacity-30"
          style={{
            backgroundImage: `url("${NOISE_DATA_URI}")`,
            backgroundSize: '128px 128px',
          }}
        />
      )}

      {/* Scanlines */}
      {showScanlines && (
        <div
          className="pointer-events-none absolute inset-0 z-[4]"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.06) 2px,
              rgba(0,0,0,0.06) 4px
            )`,
          }}
        />
      )}

      {/* Orbs */}
      {showOrbs && (
        <>
          <div
            className="absolute right-[15%] top-[-20%] z-[1] h-32 w-32 rounded-full opacity-80 blur-[60px] motion-reduce:animate-none"
            style={{ background: accent1 }}
          />
          <div
            className="absolute bottom-[-15%] left-[12%] z-[1] h-24 w-24 rounded-full opacity-70 blur-[50px] motion-reduce:animate-none"
            style={{ background: accent2 }}
          />
          <div
            className="absolute left-[42%] top-[40%] z-[1] h-20 w-20 rounded-full opacity-60 blur-[40px] motion-reduce:animate-none"
            style={{ background: accent3 }}
          />
        </>
      )}

      {/* Glow line bottom */}
      {!noOverlay && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[5] h-0.5 opacity-60"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${settings?.accent1 ?? '#3b82f6'} 25%, ${settings?.accent2 ?? '#8b5cf6'} 50%, ${settings?.accent3 ?? '#ec4899'} 75%, transparent 100%)`,
          }}
        />
      )}

      {/* Readability overlay */}
      {!noOverlay && (
        <div
          className="absolute inset-0 z-[6] rounded-t-lg"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,${overlayOpacity}) 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Badge on cover with indicator dot — показывается всегда при заполнении в админке, независимо от no_overlay */}
      {(badgeText || format) && (
        <div className="absolute left-4 top-4 z-[10]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full badge-dot-pulse"
              style={{
                background: getBadgeDotStyle(format, settings?.badge_dot_color).bg,
                boxShadow: getBadgeDotStyle(format, settings?.badge_dot_color).shadow,
              }}
              aria-hidden
            />
            {badgeText || (format ? FORMAT_LABELS[format] ?? format : '')}
          </span>
        </div>
      )}

      {/* Play icon (for online) — only when overlay is enabled */}
      {!noOverlay && showPlayIcon && (
        <div className="absolute bottom-1/2 right-1/2 z-[10] flex h-14 w-14 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
          <svg
            className="ml-1 h-6 w-6 text-white/90"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </div>
      )}

      {/* Frame corners */}
      {!noOverlay && showFrameCorners && (
        <>
          <div className="absolute left-3 top-3 z-[10] h-5 w-5 border-l-2 border-t-2 border-white/20" />
          <div className="absolute right-3 top-3 z-[10] h-5 w-5 border-r-2 border-t-2 border-white/20" />
          <div className="absolute bottom-3 left-3 z-[10] h-5 w-5 border-b-2 border-l-2 border-white/20" />
          <div className="absolute bottom-3 right-3 z-[10] h-5 w-5 border-b-2 border-r-2 border-white/20" />
        </>
      )}
    </div>
  )
}
