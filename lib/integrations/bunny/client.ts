/**
 * Утилиты для работы с Bunny Stream CDN
 */
import { publicEnv } from '@/lib/env'

const CDN_HOSTNAME = publicEnv.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME

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
  if (!CDN_HOSTNAME) {
    console.warn('[Bunny] NEXT_PUBLIC_BUNNY_CDN_HOSTNAME is not set')
    return ''
  }
  return `https://${CDN_HOSTNAME}/${normalizeVideoId(videoId)}/playlist.m3u8`
}

/**
 * URL превью-картинки (thumbnail)
 */
export function getThumbnailUrl(
  videoId: string,
  opts?: { width?: number, height?: number }
): string {
  if (!CDN_HOSTNAME) return ''
  const id = normalizeVideoId(videoId)
  const params = new URLSearchParams()
  if (opts?.width) params.set('width', String(opts.width))
  if (opts?.height) params.set('height', String(opts.height))
  const qs = params.toString()
  return `https://${CDN_HOSTNAME}/${id}/thumbnail.jpg${qs ? `?${qs}` : ''}`
}

/**
 * URL анимированного превью (animated gif/webp)
 */
export function getAnimatedThumbnailUrl(videoId: string): string {
  if (!CDN_HOSTNAME) return ''
  return `https://${CDN_HOSTNAME}/${normalizeVideoId(videoId)}/preview.webp`
}
