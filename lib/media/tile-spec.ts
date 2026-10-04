/**
 * Запись манифеста для плитки 180 px (лента на главной).
 *
 * Отдельный модуль без обращения к manifest.json: плитка клиентская, а в клиентский
 * бандл не должен попадать весь манифест (см. manifest.ts, только типы).
 *
 * У landscape-записи мобильный набор (постеры 480/960 px, превью 960×540) хватает
 * плитке на любом экране, а десктопный (постеры 1280/1920 px, превью до 2,6 МБ)
 * для кадра 180 px лишний. Вертикальные записи (мобильный кроп hero) не трогаем:
 * их мобильный кадр не 16:9.
 */
import type { MediaSurfaceSpec } from './manifest'

export const TILE_POSTER_SIZES = '180px'

export function toTileSpec(spec: MediaSurfaceSpec): MediaSurfaceSpec {
  const { mobile } = spec.poster
  if (mobile.width < mobile.height) return spec
  const mp4 = spec.mp4.mobile ?? spec.mp4.desktop
  return {
    ...spec,
    poster: { desktop: mobile, mobile },
    mp4: { desktop: mp4, mobile: mp4 },
  }
}
