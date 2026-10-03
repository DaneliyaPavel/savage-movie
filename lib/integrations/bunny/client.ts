/**
 * Утилиты для работы с Bunny Stream CDN
 */
import { STREAM_MEDIA_BASE_URL } from '@/lib/media/config'

// База HLS и превью Bunny: хост из NEXT_PUBLIC_BUNNY_CDN_HOSTNAME или явный override (lib/media/config.ts)
const CDN_BASE = STREAM_MEDIA_BASE_URL

/**
 * Нормализует любой идентификатор видео к чистому UUID.
 * Принимает:
 *   - чистый UUID: "b62f1303-b123-4da2-acb9-4f6bf7a1f84d"
 *   - Bunny player URL: "https://player.mediadelivery.net/play/624653/b62f1303-..."
 *   - Bunny iframe URL: "https://iframe.mediadelivery.net/embed/624653/b62f1303-..."
 */
export function normalizeVideoId(idOrUrl: string): string {
  if (!idOrUrl) return idOrUrl
  if (idOrUrl.startsWith('http')) {
    try {
      const url = new URL(idOrUrl)
      const segments = url.pathname.split('/').filter(Boolean)
      return segments[segments.length - 1] ?? idOrUrl
    } catch {
      return idOrUrl
    }
  }
  return idOrUrl
}

/**
 * HLS stream URL для видео
 */
export function getStreamUrl(videoId: string): string {
  if (!CDN_BASE) {
    console.warn('[Bunny] NEXT_PUBLIC_BUNNY_CDN_HOSTNAME is not set')
    return ''
  }
  return `${CDN_BASE}/${normalizeVideoId(videoId)}/playlist.m3u8`
}

/**
 * URL превью-картинки (thumbnail)
 */
export function getThumbnailUrl(
  videoId: string,
  opts?: { width?: number, height?: number }
): string {
  if (!CDN_BASE) return ''
  const id = normalizeVideoId(videoId)
  const params = new URLSearchParams()
  if (opts?.width) params.set('width', String(opts.width))
  if (opts?.height) params.set('height', String(opts.height))
  const qs = params.toString()
  return `${CDN_BASE}/${id}/thumbnail.jpg${qs ? `?${qs}` : ''}`
}

/**
 * URL анимированного превью (animated gif/webp)
 */
export function getAnimatedThumbnailUrl(videoId: string): string {
  if (!CDN_BASE) return ''
  return `${CDN_BASE}/${normalizeVideoId(videoId)}/preview.webp`
}
