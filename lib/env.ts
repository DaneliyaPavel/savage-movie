import { z } from 'zod'

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalNonEmptyString = z.preprocess(emptyToUndefined, z.string().min(1).optional())

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: optionalNonEmptyString,
  NEXT_PUBLIC_APP_URL: optionalNonEmptyString,
  NEXT_PUBLIC_CALENDLY_URL: optionalNonEmptyString,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: optionalNonEmptyString,
  NEXT_PUBLIC_YANDEX_CLIENT_ID: optionalNonEmptyString,
  NEXT_PUBLIC_MUX_ENV_KEY: optionalNonEmptyString,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: optionalNonEmptyString,
  NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID: optionalNonEmptyString,
})

export const publicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CALENDLY_URL: process.env.NEXT_PUBLIC_CALENDLY_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_YANDEX_CLIENT_ID: process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID,
  NEXT_PUBLIC_MUX_ENV_KEY: process.env.NEXT_PUBLIC_MUX_ENV_KEY,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID: process.env.NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID,
})
