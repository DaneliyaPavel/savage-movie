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

    // Video
    MUX_TOKEN_ID: optionalNonEmptyString,
    MUX_TOKEN_SECRET: optionalNonEmptyString,

    // Email
    RESEND_API_KEY: optionalNonEmptyString,
    RESEND_FROM_EMAIL: optionalNonEmptyString,
    ADMIN_EMAIL: optionalNonEmptyString,

    // Uploads
    UPLOAD_DIR: optionalNonEmptyString,
  })
  .passthrough()

export const serverEnv = ServerEnvSchema.parse(process.env)
