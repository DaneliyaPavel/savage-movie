/**
 * Пары «до / после» для /ai-video: файлы в public/media и запись в compare-pairs.json должны
 * совпадать байт в байт (имя содержит хеш, кеш — immutable на год), а две стороны пары — быть
 * одинаковыми по длине и частоте кадров: иначе шов покажет сдвиг по времени.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import raw from '../compare-pairs.json'
import { comparePair, type ComparePairId } from '../compare-pairs'

const PUBLIC_MEDIA = path.resolve(__dirname, '../../../public/media')
const IDS: ComparePairId[] = ['student', 'lech']

const sha8 = (file: string) =>
  createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8)

interface RawTarget {
  video: { file: string; width: number; height: number; bytes: number }
  poster: { avif: { file: string; bytes: number }; jpeg: { file: string; bytes: number } }
}
type RawManifest = {
  pairs: Record<
    string,
    {
      fps: number
      frames: number
      duration: number
      before: Record<'desktop' | 'mobile', RawTarget>
      after: Record<'desktop' | 'mobile', RawTarget>
    }
  >
}
const manifest = raw as unknown as RawManifest

describe.each(IDS)('пара «%s»', id => {
  const pair = manifest.pairs[id]!

  it('длина и частота кадров считаются по кадрам: 24 к/с, целое число кадров', () => {
    expect(pair.fps).toBe(24)
    expect(Number.isInteger(pair.frames)).toBe(true)
    expect(pair.duration).toBeCloseTo(pair.frames / pair.fps, 2)
  })

  it('«до» и «после» одного размера на каждой цели', () => {
    for (const kind of ['desktop', 'mobile'] as const) {
      expect(pair.before[kind].video.width).toBe(pair.after[kind].video.width)
      expect(pair.before[kind].video.height).toBe(pair.after[kind].video.height)
    }
  })

  const entries = (['before', 'after'] as const).flatMap(side =>
    (['desktop', 'mobile'] as const).flatMap(kind => {
      const target = pair[side][kind]
      return [
        [target.video.file, target.video.bytes],
        [target.poster.avif.file, target.poster.avif.bytes],
        [target.poster.jpeg.file, target.poster.jpeg.bytes],
      ] as const
    })
  )

  it.each(entries)('файл %s есть, размер и хеш в имени совпадают', (file, bytes) => {
    const full = path.join(PUBLIC_MEDIA, file)
    expect(existsSync(full), `нет ${file} в public/media`).toBe(true)
    expect(statSync(full).size).toBe(bytes)
    expect(file).toMatch(new RegExp(`\\.${sha8(full)}\\.[a-z0-9]+$`))
  })

  it('comparePair отдаёт адреса под /media', () => {
    const spec = comparePair(id)
    expect(spec.before.desktop.video).toMatch(/^\/media\/ai-.*\.mp4$/)
    expect(spec.after.mobile.posterAvif).toMatch(/^\/media\/ai-.*\.avif$/)
    expect(spec.duration).toBe(pair.duration)
  })
})
