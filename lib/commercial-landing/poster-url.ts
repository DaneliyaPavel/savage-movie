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

export function normalizePosterUrl(url: string): string {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    // Относительный путь (свои /uploads/...) или невалидный URL — не трогаем
    return url
  }
  if (!isBunnyStreamHost(hostname)) return url
  return url.replace(/\/preview\.webp(?:\?.*)?$/i, '/thumbnail.jpg')
}
