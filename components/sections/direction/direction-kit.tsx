/**
 * Общие мелочи кита страниц направлений: типографика, набор заголовка и
 * основная кнопка.
 *
 * Контент живёт в lib/services/pages/content и уходит в разметку поиска как
 * есть, поэтому правила набора применяются на выходе, в самой вёрстке:
 * неразрывные пробелы не попадают ни в FAQPage, ни в метаданные.
 */
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import './direction-kit.css'

const NBSP = '\u00A0'
const LETTERS = 'A-Za-zА-Яа-яЁё'

// Слово до трёх букв (с открывающей кавычкой или скобкой) не остаётся последним в строке
const SHORT_WORD = new RegExp(`^[«("'—–]*[${LETTERS}]{1,3}$`)
// Слово до пяти букв после предлога тянется к следующему: «в конце концов», «при этом мы»
const MEDIUM_WORD = new RegExp(`^[«("'—–]*[${LETTERS}]{1,5}$`)
const ENDS_WITH_DIGIT = /\d$/
const STARTS_WITH_UNIT = new RegExp(`^[${LETTERS}%]`)

/**
 * Предельная длина неразрывной цепочки: в узкой колонке и на крупном кегле
 * слишком длинный «слипшийся» кусок не поместится и вылезет за край. Фраза
 * «предлог + слово + слово» держится ещё короче, чтобы абзац не рвался рывками.
 */
const MAX_RUN = 26
const MAX_PHRASE = 16

/**
 * Русская типографика на выходе: предлоги, союзы и частицы до трёх букв
 * не остаются в конце строки, тире не отрывается от слова слева, число не
 * отрывается от единицы.
 *
 * Цепочка коротких слов («о чём и как», «и в ней») связывается целиком, а не
 * только первое слово: набор идёт по словам, а не регуляркой с общим
 * разделителем, которая съедала пробел вместе с совпадением и пропускала
 * каждое второе слово. За предлогом короткое слово (до пяти букв) тянет
 * следующее: «в конце концов» не разваливается на «в конце» и «концов».
 * Лукбехов нет: старые Safari падают на самом разборе.
 *
 * Повторный вызов на том же тексте ничего не меняет.
 */
export function typo(text: string): string {
  const parts = text.replace(/\s+—/g, `${NBSP}—`).split(/([ \t\r\n]+)/)
  let out = ''
  let run = 0
  let afterShort: boolean = false

  for (let position = 0; position < parts.length; position += 2) {
    const word = parts[position] ?? ''
    const separator = parts[position + 1] ?? ''
    const next = parts[position + 2]
    out += word
    run += word.length

    if (!next) {
      out += separator
      continue
    }

    // Последняя «часть» слова: в слове уже могут стоять неразрывные пробелы
    const tail = word.split(NBSP).pop() ?? word
    const isShort: boolean = SHORT_WORD.test(tail)
    const isPhrase: boolean =
      afterShort && MEDIUM_WORD.test(tail) && run + 1 + next.length <= MAX_PHRASE
    const isUnit: boolean = ENDS_WITH_DIGIT.test(word) && STARTS_WITH_UNIT.test(next)
    const binds: boolean = (isShort || isPhrase || isUnit) && run + 1 + next.length < MAX_RUN

    if (binds) {
      out += NBSP
      run += 1
    } else {
      out += separator
      run = 0
    }
    afterShort = binds && isShort
  }

  return out
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
  'dir-kit-meta flex items-center gap-3 font-mono uppercase text-white/60 tabular-nums'

/**
 * Заголовок раздела: гарнитура, регистр и трекинг общие, кегль задаёт сам блок.
 * Интерлиньяж 1: точка «Ё» и скобка «Й» не задевают строку выше. anywhere —
 * страховка для самых узких экранов: неразрывная пара вроде «и согласования»
 * ломается внутри слова, а не раздвигает колонку сетки.
 */
export const KIT_TITLE =
  'font-stage uppercase leading-[1] tracking-[-0.025em] text-white text-balance [overflow-wrap:anywhere]'

/** Кегль заголовка по умолчанию; узкая колонка (вопросы) берёт меньший */
export const KIT_TITLE_SIZE = 'text-[clamp(1.75rem,3.6vw,3.25rem)]'

export interface DirectionButtonProps {
  label: string
  onClick: () => void
  /** primary — белая плашка (на светлой секции сама становится чёрной); ghost — контур */
  variant?: 'primary' | 'ghost'
  /** md — 48px, строка действия в секции; lg — 72px, финальный призыв */
  size?: 'md' | 'lg'
  /**
   * Поверхность под кнопкой. По умолчанию кнопка сама определяет её: внутри
   * .dir-paper-section она чёрная, на тёмном поле — белая. paper — принудительно
   * для бумажной секции, которая не использует .dir-paper-section.
   */
  tone?: 'auto' | 'dark' | 'paper'
  className?: string
  ariaLabel?: string
}

/**
 * Основная кнопка страниц направлений — единый диалект для всех шести.
 *
 * Жирный капс Montserrat Black небольшого кегля, стрелка в круге, красная
 * шторка идёт слева направо. Состояние шторки одно и то же при наведении,
 * фокусе с клавиатуры и нажатии, поэтому на телефоне, где наведения нет,
 * отклик даёт касание. Текст на красном — чёрный (--dir-on-accent): на accent
 * он держит 4,5:1, белый дал бы меньше на более светлых оттенках. Подпись
 * проходит typo() и setTitle(): предлог не висит в конце строки, слово с
 * дефисом не рвётся.
 *
 * Высота не меньше 48px. Ширину задаёт className: кнопка растягивается по
 * колонке (w-full), а подпись уходит влево, круг со стрелкой — вправо.
 */
export function DirectionButton({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  tone = 'auto',
  className,
  ariaLabel,
}: DirectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-variant={variant}
      data-size={size}
      data-tone={tone === 'auto' ? undefined : tone}
      className={cn('dir-btn', className)}
    >
      <span className="dir-btn-label">{setTitle(label)}</span>
      <span aria-hidden="true" className="dir-btn-disc">
        <ArrowRight className="dir-btn-arrow" />
      </span>
    </button>
  )
}
