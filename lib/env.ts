/*
 * Публичные переменные окружения (NEXT_PUBLIC_*).
 *
 * Модуль попадает в клиентский бандл (lib/media/config.ts, lib/api/client.ts), поэтому
 * здесь нет zod: схема из десяти необязательных строк тянула в каждую страницу ~63 КБ
 * gzip (270 КБ разобранного кода) и исполнялась до первой отрисовки. Семантика прежняя:
 * пустая строка и строка из пробелов превращаются в undefined, остальное отдаётся как есть.
 *
 * Обращения к process.env.NEXT_PUBLIC_* оставлены буквальными: Next подставляет их при
 * сборке, динамический доступ по ключу в браузере вернул бы undefined.
 */
const emptyToUndefined = (value: string | undefined): string | undefined =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

export const publicEnv = {
  NEXT_PUBLIC_API_URL: emptyToUndefined(process.env.NEXT_PUBLIC_API_URL),
  NEXT_PUBLIC_APP_URL: emptyToUndefined(process.env.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: emptyToUndefined(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
  NEXT_PUBLIC_YANDEX_CLIENT_ID: emptyToUndefined(process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID),
  NEXT_PUBLIC_BUNNY_CDN_HOSTNAME: emptyToUndefined(process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: emptyToUndefined(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
  NEXT_PUBLIC_SHOWREEL_VIDEO_ID: emptyToUndefined(process.env.NEXT_PUBLIC_SHOWREEL_VIDEO_ID),
  // Медиа-слой (lib/media/config.ts): базы доставки и флаг hls.js progressive
  NEXT_PUBLIC_WEB_MEDIA_BASE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_WEB_MEDIA_BASE_URL),
  NEXT_PUBLIC_STREAM_MEDIA_BASE_URL: emptyToUndefined(
    process.env.NEXT_PUBLIC_STREAM_MEDIA_BASE_URL
  ),
  NEXT_PUBLIC_HLS_PROGRESSIVE: emptyToUndefined(process.env.NEXT_PUBLIC_HLS_PROGRESSIVE),
}
