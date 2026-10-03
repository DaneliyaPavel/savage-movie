import { z } from 'zod'

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalNonEmptyString = z.preprocess(emptyToUndefined, z.string().min(1).optional())

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: optionalNonEmptyString,
  NEXT_PUBLIC_APP_URL: optionalNonEmptyString,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: optionalNonEmptyString,
  NEXT_PUBLIC_YANDEX_CLIENT_ID: optionalNonEmptyString,
  NEXT_PUBLIC_BUNNY_CDN_HOSTNAME: optionalNonEmptyString,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: optionalNonEmptyString,
  NEXT_PUBLIC_SHOWREEL_VIDEO_ID: optionalNonEmptyString,
  // Медиа-слой (lib/media/config.ts): базы доставки и флаг hls.js progressive
  NEXT_PUBLIC_WEB_MEDIA_BASE_URL: optionalNonEmptyString,
  NEXT_PUBLIC_STREAM_MEDIA_BASE_URL: optionalNonEmptyString,
  NEXT_PUBLIC_HLS_PROGRESSIVE: optionalNonEmptyString,
})

export const publicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_YANDEX_CLIENT_ID: process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID,
  NEXT_PUBLIC_BUNNY_CDN_HOSTNAME: process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_SHOWREEL_VIDEO_ID: process.env.NEXT_PUBLIC_SHOWREEL_VIDEO_ID,
  NEXT_PUBLIC_WEB_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_WEB_MEDIA_BASE_URL,
  NEXT_PUBLIC_STREAM_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_STREAM_MEDIA_BASE_URL,
  NEXT_PUBLIC_HLS_PROGRESSIVE: process.env.NEXT_PUBLIC_HLS_PROGRESSIVE,
})
