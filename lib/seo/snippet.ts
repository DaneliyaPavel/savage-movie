/**
 * Заголовки и описания для страниц, чьи тексты приходят из CMS (статьи, кейсы).
 *
 * Раньше title резался как `slice(0, 59) + '…'` поверх строки вида
 * «{название} | Блог | SAVAGE MOVIE». В выдаче Google это давало
 * «… разбор бюджета | Sav…»: название целиком, бренд обрезан на середине слова.
 * Здесь режем только по границе слова, бренд не обрываем, а хвост
 * «| Savage Movie», который редакторы CMS иногда пишут в самом названии,
 * снимаем, чтобы он не дублировался в H1 и в title.
 */

const BRAND_TAIL = /\s*[|—–-]\s*sav(?:age)?\s*movie\s*$/i

/** Максимальная длина title, при которой Google обычно не обрезает заголовок */
export const TITLE_MAX = 70

/** Максимальная длина description в сниппете */
export const DESCRIPTION_MAX = 160

/** Убирает хвост «| Savage Movie» (любой регистр), в том числе повторный */
export function stripBrandTail(title: string): string {
  let result = title.trim()
  while (BRAND_TAIL.test(result)) result = result.replace(BRAND_TAIL, '').trim()
  return result
}

function clipAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max + 1)
  const space = cut.lastIndexOf(' ')
  const clipped = space > max * 0.5 ? cut.slice(0, space) : text.slice(0, max)
  return clipped.replace(/[\s,;:|—–-]+$/, '')
}

/**
 * Собирает title вида «{название} | {бренд}». Если не помещается в `max`,
 * бренд отбрасывается целиком (он и так есть в og:site_name), а не режется;
 * если и название длиннее `max`, оно режется по слову без многоточия.
 */
export function buildTitle(name: string, brand = 'Savage Movie', max = TITLE_MAX): string {
  const base = stripBrandTail(name)
  const full = `${base} | ${brand}`
  if (full.length <= max) return full
  return clipAtWord(base, max)
}

/** Description без markdown-разметки, не длиннее `max`, по возможности по границе предложения */
export function buildDescription(raw: string, max = DESCRIPTION_MAX): string {
  const text = raw
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text

  const head = text.slice(0, max)
  const sentenceEnd = Math.max(
    head.lastIndexOf('. '),
    head.lastIndexOf('! '),
    head.lastIndexOf('? ')
  )
  if (sentenceEnd >= max * 0.5) return head.slice(0, sentenceEnd + 1)

  return `${clipAtWord(text, max - 1)}…`
}
