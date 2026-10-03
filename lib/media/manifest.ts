/**
 * Манифест веб-медиа: что именно лежит в WEB_MEDIA_BASE_URL.
 *
 * manifest.json пишет scripts/media/build-web-video.mjs, руками его не правят.
 * Страницы (серверные компоненты) превращают запись в MediaSurfaceSpec с
 * готовыми URL и передают её клиентским компонентам пропом: так в клиентский
 * бандл не попадает весь манифест, а компоненты не знают про базы доставки.
 */
import raw from './manifest.json'
import { webMediaUrl } from './config'
import { extractVideoId, findVideoIds } from './video-id'

export { extractVideoId }

export interface PosterVariant {
  file: string
  w: number
  h: number
  bytes: number
}

export interface PosterSetEntry {
  width: number
  height: number
  avif: PosterVariant[]
  webp: PosterVariant[]
  jpeg: PosterVariant
}

export interface PreviewFileEntry {
  file: string
  width: number
  height: number
  bytes: number
  fps: number
  frames: number
  duration: number
  codec: string
  profile: string
  pixFmt: string
  crf: number
  faststart: boolean
  audio: boolean
}

export interface ManifestAsset {
  master?: string
  /** hero: вертикальный мобильный кроп; project: тот же кадр 16:9 меньше (см. scripts/media) */
  profile?: 'hero' | 'project'
  orientation?: 'landscape' | 'portrait'
  color: string
  lqip: string
  /** start/end — окно мастера в секундах, из которого сделано превью (настраивается в пайплайне) */
  preview: {
    start: number
    end: number
    fps: number
    frames: number
    desktop?: PreviewFileEntry
    mobile?: PreviewFileEntry
  }
  poster: { desktop: PosterSetEntry; mobile: PosterSetEntry }
  stream?: { hls: string }
}

export interface Manifest {
  version: number
  assets: Record<string, ManifestAsset>
}

export const mediaManifest = raw as unknown as Manifest

/* ───────────── то, что получают компоненты: сериализуемый вид с готовыми URL ───────────── */

export interface PosterSourceSpec {
  type: 'image/avif' | 'image/webp'
  /** srcset с дескрипторами ширины */
  srcSet: string
}

export interface PosterVariantSpec {
  width: number
  height: number
  sources: PosterSourceSpec[]
  /** JPEG: он же <img src>, последний рубеж */
  src: string
}

export interface MediaSurfaceSpec {
  key: string
  /** средний цвет кадра: фон до загрузки постера */
  color: string
  /** 24-пиксельная размытая копия кадра (data URI) */
  lqip: string
  poster: { desktop: PosterVariantSpec; mobile: PosterVariantSpec }
  mp4: { desktop?: string; mobile?: string }
  /** Bunny id полного ролика: для fallback и кнопки «смотреть полностью» */
  streamId?: string
  previewRange: { start: number; end: number }
}

function variantSpec(set: PosterSetEntry): PosterVariantSpec {
  const sources: PosterSourceSpec[] = []
  if (set.avif.length) {
    sources.push({
      type: 'image/avif',
      srcSet: set.avif.map(v => `${webMediaUrl(v.file)} ${v.w}w`).join(', '),
    })
  }
  if (set.webp.length) {
    sources.push({
      type: 'image/webp',
      srcSet: set.webp.map(v => `${webMediaUrl(v.file)} ${v.w}w`).join(', '),
    })
  }
  return {
    width: set.width,
    height: set.height,
    sources,
    src: webMediaUrl(set.jpeg.file),
  }
}

export function toSurfaceSpec(key: string, asset: ManifestAsset): MediaSurfaceSpec {
  return {
    key,
    color: asset.color,
    lqip: asset.lqip,
    poster: {
      desktop: variantSpec(asset.poster.desktop),
      mobile: variantSpec(asset.poster.mobile),
    },
    mp4: {
      desktop: asset.preview.desktop ? webMediaUrl(asset.preview.desktop.file) : undefined,
      mobile: asset.preview.mobile ? webMediaUrl(asset.preview.mobile.file) : undefined,
    },
    streamId: asset.stream?.hls,
    previewRange: { start: asset.preview.start, end: asset.preview.end },
  }
}

export function getMediaSpec(key: string): MediaSurfaceSpec | null {
  const asset = mediaManifest.assets[key]
  return asset ? toSurfaceSpec(key, asset) : null
}

/** Запись манифеста по id Bunny-видео или ссылке на него (ключ или stream.hls) */
export function findMediaSpecByVideoId(
  videoId: string | null | undefined
): MediaSurfaceSpec | null {
  if (!videoId) return null
  const wanted = extractVideoId(videoId).toLowerCase()
  for (const [key, asset] of Object.entries(mediaManifest.assets)) {
    if (key.toLowerCase() === wanted || asset.stream?.hls.toLowerCase() === wanted) {
      return toSurfaceSpec(key, asset)
    }
  }
  return null
}

/**
 * Карта {id видео → spec} для списка: серверная страница отдаёт её клиентскому
 * списку. Ключ всегда голый id (даже если пришла ссылка), поэтому клиент ищет
 * по нему же, не зная, в каком виде видео хранится в проекте.
 */
export function mediaSpecsByVideoIds(
  videoIds: Array<string | null | undefined>
): Record<string, MediaSurfaceSpec> {
  const out: Record<string, MediaSurfaceSpec> = {}
  for (const raw of videoIds) {
    if (!raw) continue
    const id = extractVideoId(raw)
    if (out[id]) continue
    const spec = findMediaSpecByVideoId(id)
    if (spec) out[id] = spec
  }
  return out
}

/** Все id Bunny-видео внутри произвольного контента (CMS, список работ): и голые, и в ссылках */
export function collectVideoIds(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (typeof value === 'string') {
    findVideoIds(value).forEach(id => into.add(id))
  } else if (Array.isArray(value)) {
    value.forEach(item => collectVideoIds(item, into))
  } else if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(item => collectVideoIds(item, into))
  }
  return into
}

/** Карта specs для всего видео внутри контента страницы */
export function mediaSpecsForContent(...contents: unknown[]): Record<string, MediaSurfaceSpec> {
  const ids = new Set<string>()
  contents.forEach(content => collectVideoIds(content, ids))
  return mediaSpecsByVideoIds([...ids])
}
