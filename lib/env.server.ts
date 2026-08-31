import { z } from 'zod'

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const optionalNonEmptyString = z.preprocess(emptyToUndefined, z.string().min(1).optional())

const ServerEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    API_URL: optionalNonEmptyString,

    // Payments
    YOOKASSA_SHOP_ID: optionalNonEmptyString,
    YOOKASSA_SECRET_KEY: optionalNonEmptyString,

    // Video (Bunny Stream)
    BUNNY_STREAM_API_KEY: optionalNonEmptyString,
    BUNNY_STREAM_LIBRARY_ID: optionalNonEmptyString,
    BUNNY_STREAM_CDN_HOSTNAME: optionalNonEmptyString,

    // Email
    RESEND_API_KEY: optionalNonEmptyString,
    RESEND_FROM_EMAIL: optionalNonEmptyString,
    ADMIN_EMAIL: optionalNonEmptyString,

    // SMTP (Яндекс 360) — основной канал доставки заявок
    SMTP_HOST: optionalNonEmptyString,
    SMTP_PORT: optionalNonEmptyString,
    SMTP_USER: optionalNonEmptyString,
    SMTP_PASSWORD: optionalNonEmptyString,
    SMTP_FROM: optionalNonEmptyString,

    // Telegram
    TELEGRAM_BOT_TOKEN: optionalNonEmptyString,
    TELEGRAM_CHAT_ID: optionalNonEmptyString,
    // Реле Bot API, если прямой доступ закрыт
    TELEGRAM_API_BASE: optionalNonEmptyString,

    // Uploads
    UPLOAD_DIR: optionalNonEmptyString,
  })
  .passthrough()

export const serverEnv = ServerEnvSchema.parse(process.env)
