/**
 * Манифест веб-медиа и файлы в public/media должны совпадать байт в байт:
 * имя файла содержит хеш содержимого, а immutable-кеш на год делает ошибку
 * необратимой для вернувшихся посетителей. Тест ловит рассинхрон до деплоя.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  collectVideoIds,
  extractVideoId,
  findMediaSpecByVideoId,
  getMediaSpec,
  mediaManifest,
  mediaSpecsByVideoIds,
  mediaSpecsForContent,
  toSurfaceSpec,
} from '../manifest'

const PUBLIC_MEDIA = path.resolve(__dirname, '../../../public/media')

const SHOWREEL_ID = '83ad0e8e-c614-46fd-8324-2c26659ad721'

function sha8(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8)
}

describe('манифест веб-медиа', () => {
  const assets = Object.entries(mediaManifest.assets)

  it('содержит showreel', () => {
    expect(mediaManifest.assets.showreel).toBeDefined()
  })

  describe.each(assets)('%s', (_key, asset) => {
    const files = [
      ...(asset.preview.desktop ? [asset.preview.desktop] : []),
      ...(asset.preview.mobile ? [asset.preview.mobile] : []),
    ]
    const posters = [asset.poster.desktop, asset.poster.mobile].flatMap(set => [
      ...set.avif,
      ...set.webp,
      set.jpeg,
    ])

    // Превью проектов выкладываются на VDS в /var/www/savage-media, а не в git
    // (docs/media-pipeline.md, дорожка 2): их файлов в public/media нет. Для них
    // проверяется только форма записи, а наличие файлов гарантирует
    // merge-manifest.mjs --check-files на этапе выкладки
    const external = asset.profile === 'project'

    it.skipIf(external).each([...files, ...posters].map(entry => [entry.file, entry] as const))(
      'файл %s есть на диске, размер и хеш в имени совпадают',
      (file, entry) => {
        const full = path.join(PUBLIC_MEDIA, file)
        expect(existsSync(full), `нет ${file} в public/media`).toBe(true)
        expect(statSync(full).size).toBe(entry.bytes)
        expect(file).toMatch(new RegExp(`\\.${sha8(full)}\\.[a-z0-9]+$`))
      }
    )

    it.each([...files, ...posters].map(entry => [entry.file, entry] as const))(
      'имя файла %s содержит хеш и расширение, размер положительный',
      (file, entry) => {
        expect(file).toMatch(/\.[0-9a-f]{8}\.[a-z0-9]+$/)
        expect(entry.bytes).toBeGreaterThan(0)
      }
    )

    it('MP4 соответствует контракту: H.264 High, yuv420p, без звука, faststart', () => {
      expect(files.length).toBeGreaterThan(0)
      for (const preview of files) {
        expect(preview.codec).toMatch(/^avc1\./)
        expect(preview.profile).toBe('High')
        expect(preview.pixFmt).toBe('yuv420p')
        expect(preview.audio).toBe(false)
        expect(preview.faststart).toBe(true)
      }
    })

    it('окно превью задано и лежит внутри мастера', () => {
      expect(asset.preview.end).toBeGreaterThan(asset.preview.start)
      expect(asset.preview.start).toBeGreaterThanOrEqual(0)
    })
  })

  it('десктопный MP4 — 1920×1080', () => {
    const preview = mediaManifest.assets.showreel!.preview.desktop!
    expect([preview.width, preview.height]).toEqual([1920, 1080])
  })
})

describe('MediaSurfaceSpec', () => {
  const spec = getMediaSpec('showreel')!

  it('собирает URL из WEB_MEDIA_BASE_URL и не теряет хеш', () => {
    expect(spec.mp4.desktop).toMatch(/^\/media\/showreel-preview-desktop\.[0-9a-f]{8}\.mp4$/)
    expect(spec.mp4.mobile).toMatch(/^\/media\/showreel-preview-mobile\.[0-9a-f]{8}\.mp4$/)
    expect(spec.poster.desktop.src).toMatch(/\.jpg$/)
  })

  it('постер: AVIF первым, WebP вторым, JPEG как src; srcset с дескрипторами ширины', () => {
    const types = spec.poster.desktop.sources.map(source => source.type)
    expect(types).toEqual(['image/avif', 'image/webp'])
    for (const source of spec.poster.desktop.sources) {
      expect(source.srcSet).toMatch(/\s\d+w(,|$)/)
    }
  })

  it('размеры постера заданы: без них будет layout shift', () => {
    for (const variant of [spec.poster.desktop, spec.poster.mobile]) {
      expect(variant.width).toBeGreaterThan(0)
      expect(variant.height).toBeGreaterThan(0)
    }
  })

  it('toSurfaceSpec не мутирует манифест', () => {
    const before = JSON.stringify(mediaManifest)
    toSurfaceSpec('showreel', mediaManifest.assets.showreel!)
    expect(JSON.stringify(mediaManifest)).toBe(before)
  })

  it('отдаёт цвет и lqip для фона до загрузки постера', () => {
    expect(spec.color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(spec.lqip).toMatch(/^data:image\//)
  })
})

describe('поиск по id видео', () => {
  it('находит запись по Bunny id шоурила, регистр не важен', () => {
    expect(findMediaSpecByVideoId(SHOWREEL_ID)?.key).toBe('showreel')
    expect(findMediaSpecByVideoId(SHOWREEL_ID.toUpperCase())?.key).toBe('showreel')
  })

  it('неизвестный id, пусто и null дают null', () => {
    expect(findMediaSpecByVideoId('00000000-0000-0000-0000-000000000000')).toBeNull()
    expect(findMediaSpecByVideoId('')).toBeNull()
    expect(findMediaSpecByVideoId(null)).toBeNull()
    expect(findMediaSpecByVideoId(undefined)).toBeNull()
  })

  it('находит запись и по ссылке плеера: так видео хранит админка', () => {
    const url = `https://player.mediadelivery.net/play/624653/${SHOWREEL_ID}`
    expect(findMediaSpecByVideoId(url)?.key).toBe('showreel')
    expect(extractVideoId(url)).toBe(SHOWREEL_ID)
    // ключ карты — голый id, даже если пришла ссылка: клиент ищет по нему
    expect(Object.keys(mediaSpecsByVideoIds([url]))).toEqual([SHOWREEL_ID])
  })

  it('collectVideoIds достаёт id и из ссылок', () => {
    const ids = collectVideoIds({ video: `https://player.mediadelivery.net/play/1/${SHOWREEL_ID}` })
    expect([...ids]).toEqual([SHOWREEL_ID])
  })

  it('mediaSpecsByVideoIds возвращает карту только для известных id', () => {
    const map = mediaSpecsByVideoIds([SHOWREEL_ID, null, 'unknown'])
    expect(Object.keys(map)).toEqual([SHOWREEL_ID])
  })

  it('collectVideoIds достаёт UUID из вложенного контента и игнорирует остальное', () => {
    const ids = collectVideoIds({
      hero: { videoPlaybackId: SHOWREEL_ID, title: 'не uuid' },
      list: [{ id: 'abc' }, { playbackId: '11111111-2222-3333-4444-555555555555' }],
      n: 5,
    })
    expect([...ids].sort()).toEqual([SHOWREEL_ID, '11111111-2222-3333-4444-555555555555'].sort())
  })

  it('mediaSpecsForContent берёт id из любого контента', () => {
    const map = mediaSpecsForContent({ a: [{ b: SHOWREEL_ID }] }, 'x')
    expect(Object.keys(map)).toEqual([SHOWREEL_ID])
  })
})
