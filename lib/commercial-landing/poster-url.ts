/**
 * Bunny Stream отдаёт два разных превью на видео: статичный `thumbnail.jpg`
 * и анимированный `preview.webp` (десятки кадров, в разы тяжелее и не
 * учитывает prefers-reduced-motion). Если в CMS в поле постера вручную
 * вставили ссылку на анимированный вариант, карточка размером в пару сотен
 * пикселей молча тянет мегабайтный файл и играет его как gif. Возвращаем то,
 * что и предполагалось — статичный кадр того же видео.
 *
 * Переписываем только когда точно знаем контракт URL — хост Bunny CDN
 * (`*.b-cdn.net`, тот же, что уже разрешён для next/image в next.config.ts).
 * У произвольного стороннего `https://example.com/preview.webp` нет никакой
 * гарантии, что `https://example.com/thumbnail.jpg` вообще существует —
 * такой URL возвращаем как есть.
 */

function isBunnyStreamHost(hostname: string): boolean {
  return /(^|\.)b-cdn\.net$/i.test(hostname)
}

/**
 * Путь вида `/{uuid}/preview.webp` — это контракт самого Bunny Stream, и он
 * не меняется от того, через какой хост библиотека раздаётся. Сейчас она
 * ходит через собственный прокси сайта (`/cdn/{uuid}/...`), поэтому проверки
 * одного лишь хоста `*.b-cdn.net` перестало хватать: анимированный webp
 * уезжал в постер как есть.
 */
const BUNNY_PREVIEW_PATH =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/preview\.webp$/i

export function normalizePosterUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url, 'https://savagemovie.invalid')
  } catch {
    // Невалидный URL — не трогаем
    return url
  }
  if (!isBunnyStreamHost(parsed.hostname) && !BUNNY_PREVIEW_PATH.test(parsed.pathname)) return url
  return url.replace(/\/preview\.webp(?:\?.*)?$/i, '/thumbnail.jpg')
}

/**
 * Можно ли отдать постер через next/image.
 *
 * Next.js оптимизирует только свой хост и хосты из remotePatterns
 * (next.config.ts): на произвольном внешнем адресе, вписанном в CMS руками,
 * оптимизатор падает с ошибкой конфигурации. Поэтому пропускаем свой же путь
 * (начинается с "/") и уже разрешённый Bunny CDN, а на всём остальном
 * остаёмся на обычном <img>.
 *
 * Разница не косметическая: кадры галерей лежат в CMS исходниками на три,
 * пять и восемь мегабайт. Тот же кадр через оптимизатор приезжает в AVIF под
 * реальный размер блока.
 */
export function canOptimizePoster(url: string): boolean {
  if (url.startsWith('/')) return true
  try {
    return /(^|\.)b-cdn\.net$/i.test(new URL(url).hostname)
  } catch {
    return false
  }
}
