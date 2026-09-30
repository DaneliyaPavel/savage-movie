/**
 * Общие мелочи кита страниц направлений: типографика и набор заголовка.
 *
 * Контент живёт в lib/services/pages/content и уходит в разметку поиска как
 * есть, поэтому правила набора применяются на выходе, в самой вёрстке:
 * неразрывные пробелы не попадают ни в FAQPage, ни в метаданные.
 */
import type { ReactNode } from 'react'

const NBSP = ' '
const LETTER = 'A-Za-zА-Яа-яЁё'

// Слово до трёх букв не остаётся последним в строке. Двух проходов хватает на
// цепочку «и в ней»: лукбехи не берём, старые Safari падают на самом разборе
const SHORT_WORD = new RegExp(`(^|[\\s«("'—–])([${LETTER}]{1,3})\\s+(?=\\S)`, 'g')
const NUMBER_UNIT = new RegExp(`(\\d)\\s+(?=[${LETTER}%])`, 'g')

export function typo(text: string): string {
  return text
    .replace(/\s+—/g, `${NBSP}—`)
    .replace(SHORT_WORD, `$1$2${NBSP}`)
    .replace(SHORT_WORD, `$1$2${NBSP}`)
    .replace(NUMBER_UNIT, `$1${NBSP}`)
}

/**
 * Заголовок раздела: слова с дефисом («fashion-видео», «AI-видео») не
 * рвутся по дефису — иначе в узкой колонке «FASHION-» остаётся на одной
 * строке, а «ВИДЕО» уезжает на следующую.
 */
export function setTitle(title: string): ReactNode {
  return typo(title)
    .split(' ')
    .map((word, position) => (
      <span key={`${word}-${position}`}>
        {position > 0 ? ' ' : ''}
        {word.includes('-') ? <span className="whitespace-nowrap">{word}</span> : word}
      </span>
    ))
}

/** Служебная строка раздела: красная риска и «07 / Вопросы», как в финале страницы */
export const KIT_KICKER =
  'type-meta flex items-center gap-3 font-mono uppercase text-white/60 tabular-nums'

/** Заголовок раздела: гарнитура, регистр и трекинг общие, кегль задаёт сам блок */
export const KIT_TITLE =
  'font-stage uppercase leading-[0.94] tracking-[-0.025em] text-white text-balance'

/** Кегль заголовка по умолчанию; узкая колонка (вопросы) берёт меньший */
export const KIT_TITLE_SIZE = 'text-[clamp(1.75rem,3.6vw,3.25rem)]'
