/**
 * Интеграция с Mux для работы с видео
 */
import Mux from '@mux/mux-node'

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

/**
 * Создает прямую загрузку в Mux
 */
export async function createDirectUpload() {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error('Mux credentials не настроены')
  }

  try {
    // @ts-ignore - Mux API может отличаться в зависимости от версии
    const upload = await muxClient.video.directUploads.create({
      new_asset_settings: {
        playback_policy: 'public',
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || '*',
    })

    return upload
  } catch (error) {
    console.error('Ошибка создания прямой загрузки в Mux:', error)
    throw error
  }
}

/**
 * Получает информацию об ассете
 */
export async function getAsset(assetId: string) {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error('Mux credentials не настроены')
  }

  try {
    // @ts-ignore - Mux API может отличаться в зависимости от версии
    const asset = await muxClient.video.assets.retrieve(assetId)
    return asset
  } catch (error) {
    console.error('Ошибка получения ассета из Mux:', error)
    throw error
  }
}

/**
 * Удаляет ассет из Mux
 */
export async function deleteAsset(assetId: string) {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error('Mux credentials не настроены')
  }

  try {
    // @ts-ignore - Mux API может отличаться в зависимости от версии
    await muxClient.video.assets.delete(assetId)
  } catch (error) {
    console.error('Ошибка удаления ассета из Mux:', error)
    throw error
  }
}
