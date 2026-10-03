/**
 * Откуда сайт берёт медиа. Два независимых источника, чтобы их можно было
 * переезжать по отдельности, не трогая компоненты:
 *
 *   WEB_MEDIA_BASE_URL     критичные файлы первого экрана: постеры и короткие
 *                          MP4-превью. По умолчанию тот же origin (/media),
 *                          без DNS, TLS и прогрева чужого хоста; имена файлов
 *                          содержат хэш, кэш — immutable на год.
 *   STREAM_MEDIA_BASE_URL  HLS и превью Bunny. По умолчанию тот же хост, что
 *                          и раньше (NEXT_PUBLIC_BUNNY_CDN_HOSTNAME, прокси
 *                          /cdn/), либо явный NEXT_PUBLIC_STREAM_MEDIA_BASE_URL
 *                          — например, российский CDN перед Bunny.
 *
 * Модуль без побочных эффектов и без зависимостей от React: его используют и
 * серверные страницы, и клиентские компоненты, и тесты.
 */
import { publicEnv } from '@/lib/env'

/** Граница мобильного варианта. Одна строка для <source media> постера и для data-sm-mq */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

function normalizeBase(value: string | undefined, fallback: string): string {
  const base = (value ?? fallback).trim().replace(/\/+$/, '')
  return base || fallback
}

export const WEB_MEDIA_BASE_URL = normalizeBase(publicEnv.NEXT_PUBLIC_WEB_MEDIA_BASE_URL, '/media')

function resolveStreamBase(): string {
  const explicit = publicEnv.NEXT_PUBLIC_STREAM_MEDIA_BASE_URL
  if (explicit) return normalizeBase(explicit, '')
  const host = publicEnv.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME
  return host ? `https://${host.replace(/\/+$/, '')}` : ''
}

export const STREAM_MEDIA_BASE_URL = resolveStreamBase()

/** hls.js `progressive`: включается только после сравнения на реальном H.264 (см. docs/media-pipeline.md) */
export const HLS_PROGRESSIVE = publicEnv.NEXT_PUBLIC_HLS_PROGRESSIVE === 'true'

export function webMediaUrl(file: string): string {
  return `${WEB_MEDIA_BASE_URL}/${file.replace(/^\/+/, '')}`
}

export function streamPlaylistUrl(videoId: string): string {
  return STREAM_MEDIA_BASE_URL ? `${STREAM_MEDIA_BASE_URL}/${videoId}/playlist.m3u8` : ''
}

export function streamThumbnailUrl(videoId: string): string {
  return STREAM_MEDIA_BASE_URL ? `${STREAM_MEDIA_BASE_URL}/${videoId}/thumbnail.jpg` : ''
}
