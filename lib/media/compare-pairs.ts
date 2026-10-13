/**
 * Пары «до ИИ / после ИИ»: два синхронных MP4 и постеры из нулевого кадра.
 *
 * compare-pairs.json пишет scripts/media/build-compare-pairs.mjs, руками его не правят.
 * Файлы лежат в public/media (имя содержит хеш содержимого) и отдаются тем же путём
 * `/media/`, что и hero.
 */
import raw from './compare-pairs.json'
import { webMediaUrl } from './config'

export type ComparePairId = 'student' | 'lech'

interface RawPoster {
  file: string
  w: number
  h: number
  bytes: number
}

interface RawTarget {
  video: { file: string; width: number; height: number; bytes: number }
  poster: { color: string; avif: RawPoster; jpeg: RawPoster }
}

interface RawPair {
  fps: number
  frames: number
  duration: number
  speed: number
  before: { desktop: RawTarget; mobile: RawTarget }
  after: { desktop: RawTarget; mobile: RawTarget }
}

interface CompareManifest {
  version: number
  pairs: Record<string, RawPair>
}

const manifest = raw as unknown as CompareManifest

export interface PairTargetSpec {
  video: string
  width: number
  height: number
  posterAvif: string
  posterJpeg: string
  /** Средний цвет кадра: фон под постером, пока тот не пришёл */
  color: string
}

export interface PairSideSpec {
  desktop: PairTargetSpec
  mobile: PairTargetSpec
}

export interface ComparePairSpec {
  id: ComparePairId
  duration: number
  fps: number
  before: PairSideSpec
  after: PairSideSpec
}

function target(entry: RawTarget): PairTargetSpec {
  return {
    video: webMediaUrl(entry.video.file),
    width: entry.video.width,
    height: entry.video.height,
    posterAvif: webMediaUrl(entry.poster.avif.file),
    posterJpeg: webMediaUrl(entry.poster.jpeg.file),
    color: entry.poster.color,
  }
}

export function comparePair(id: ComparePairId): ComparePairSpec {
  const pair = manifest.pairs[id]
  if (!pair) throw new Error(`compare-pairs.json: нет пары «${id}»`)
  return {
    id,
    duration: pair.duration,
    fps: pair.fps,
    before: { desktop: target(pair.before.desktop), mobile: target(pair.before.mobile) },
    after: { desktop: target(pair.after.desktop), mobile: target(pair.after.mobile) },
  }
}
