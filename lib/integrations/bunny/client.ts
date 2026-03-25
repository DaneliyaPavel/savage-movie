/**
 * Утилиты для работы с Bunny Stream CDN
 */
import { publicEnv } from '@/lib/env'

const CDN_HOSTNAME = publicEnv.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME

/**
 * HLS stream URL для видео
 */
export function getStreamUrl(videoId: string): string {
  return `https://${CDN_HOSTNAME}/${videoId}/playlist.m3u8`
}

/**
 * URL превью-картинки (thumbnail)
 */
export function getThumbnailUrl(
  videoId: string,
  opts?: { width?: number, height?: number }
): string {
  const params = new URLSearchParams()
  if (opts?.width) params.set('width', String(opts.width))
  if (opts?.height) params.set('height', String(opts.height))
  const qs = params.toString()
  return `https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg${qs ? `?${qs}` : ''}`
}

/**
 * URL анимированного превью (animated gif/webp)
 */
export function getAnimatedThumbnailUrl(videoId: string): string {
  return `https://${CDN_HOSTNAME}/${videoId}/preview.webp`
}
