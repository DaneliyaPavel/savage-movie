/**
 * Интеграция с Mux для работы с видео
 */
import Mux from '@mux/mux-node'
import { logger } from '@/lib/utils/logger'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

// Типы для Mux API (на основе документации @mux/mux-node)
interface MuxDirectUpload {
  id: string
  url: string
  status: string
  new_asset_settings?: {
    playback_policy?: string
  }
  cors_origin?: string
  [key: string]: unknown
}

interface MuxAsset {
  id: string
  status: string
  playback_ids?: Array<{ id: string; policy: string }>
  [key: string]: unknown
}

let muxClient: Mux | null = null

function getMuxClient(): Mux {
  const tokenId = serverEnv.MUX_TOKEN_ID
  const tokenSecret = serverEnv.MUX_TOKEN_SECRET

  if (!tokenId || !tokenSecret) {
    throw new Error('Mux credentials не настроены')
  }

  if (!muxClient) {
    muxClient = new Mux({ tokenId, tokenSecret })
  }

  return muxClient
}

/**
 * Создает прямую загрузку в Mux
 */
export async function createDirectUpload(): Promise<MuxDirectUpload> {
  try {
    const client = getMuxClient()
    // Используем type assertion для обхода проблем типизации Mux SDK
    const upload = (await ((client.video as unknown as { directUploads: unknown }).directUploads as unknown as {
      create: (params: {
        new_asset_settings?: { playback_policy?: string }
        cors_origin?: string
      }) => Promise<MuxDirectUpload>
    }).create({
      new_asset_settings: {
        playback_policy: 'public',
      },
      cors_origin: publicEnv.NEXT_PUBLIC_APP_URL || '*',
    })) as MuxDirectUpload

    return upload
  } catch (error) {
    logger.error('Ошибка создания прямой загрузки в Mux', error, { function: 'createDirectUpload' })
    throw error
  }
}

/**
 * Получает информацию об ассете
 */
export async function getAsset(assetId: string): Promise<MuxAsset> {
  try {
    const client = getMuxClient()
    const asset = (await (client.video.assets as unknown as {
      retrieve: (assetId: string) => Promise<MuxAsset>
    }).retrieve(assetId)) as MuxAsset

    return asset
  } catch (error) {
    logger.error('Ошибка получения ассета из Mux', error, { function: 'getAsset', assetId })
    throw error
  }
}

/**
 * Удаляет ассет из Mux
 */
export async function deleteAsset(assetId: string): Promise<void> {
  try {
    const client = getMuxClient()
    await (client.video.assets as unknown as {
      delete: (assetId: string) => Promise<void>
    }).delete(assetId)
  } catch (error) {
    logger.error('Ошибка удаления ассета из Mux', error, { function: 'deleteAsset', assetId })
    throw error
  }
}
