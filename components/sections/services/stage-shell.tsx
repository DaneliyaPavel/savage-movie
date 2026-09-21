'use client'

import type { ReactNode, RefObject } from 'react'

import { cn } from '@/lib/utils'
import type { ResolvedDirection } from '@/lib/services/proof'

/**
 * Оболочка сцены: высокий контейнер и залипающий в нём экран.
 *
 * Это единственное, что у семи территорий общего. Раньше общей была ещё и
 * композиция — заголовок, копия, прямоугольное медиа, мета, CTA, — и именно
 * поэтому реклама, fashion и beauty выглядели тремя настройками одного
 * компонента. Здесь оболочка не знает про содержимое вообще: она отвечает за
 * то, что сцена занимает экран целиком и держится, пока идёт её прогресс.
 *
 * depth — во сколько экранов длится территория. Это её экранное время:
 * у сцены с восемью состояниями его должно быть больше, чем у сцены с тремя.
 */

/**
 * Отступ сверху, ниже которого сцена имеет право что-то рисовать.
 *
 * Техническая строка стоит на pt-24/pt-28 и занимает строку: всё, что
 * начинается выше этой отметки, ложится прямо на неё. Значение было выписано
 * руками в четырёх сценах тремя разными числами (7rem, 8.5rem, pt-28, pt-32),
 * и в регулярном продакшне монтажный лист начинался на четырнадцать пикселей
 * выше нижней кромки строки — на коротком экране они пересекались.
 */
export const STAGE_TOP = 'pt-[7rem] md:pt-[8.5rem]'
/** То же расстояние для абсолютно позиционированных слоёв */
export const STAGE_TOP_INSET = 'top-[7rem] md:top-[8.5rem]'

/** Нижнее поле сцены. Общее на все семь: под ним стоит головка таймлайна */
export const STAGE_BOTTOM = 'pb-14 md:pb-16'

export interface StageShellProps {
  id: string
  direction: ResolvedDirection
  containerRef: RefObject<HTMLElement | null>
  /** Длительность территории в высотах экрана */
  depth: number
  theme?: 'black' | 'white'
  /** Фон сцены, если нужен не базовый чёрный */
  surfaceClassName?: string
  children: ReactNode
}

export function StageShell({
  id,
  direction,
  containerRef,
  depth,
  theme = 'black',
  surfaceClassName,
  children,
}: StageShellProps) {
  const isLight = theme === 'white'
  const surface = surfaceClassName ?? (isLight ? 'bg-white' : 'bg-[#0D0D0D]')

  return (
    <section
      id={id}
      ref={containerRef}
      data-stage={direction.id}
      data-stage-theme={theme}
      aria-labelledby={`${id}-title`}
      /*
       * Фон стоит и на контейнере, и на залипающем экране.
       *
       * Высота контейнера задана в svh, и на большинстве телефонов она
       * получается дробной: 260svh при экране 844 — это 2194.39px. Залипающий
       * экран при этом ровно 844. На стыке двух сцен остаётся доля пикселя, в
       * которой видно фон <main> — на переходе «реклама → fashion» это тёмная
       * нитка поперёк белого разворота. Пока контейнер покрашен сам, в этой
       * доле пикселя оказывается собственный цвет сцены, и шва нет.
       */
      className={cn('relative', surface)}
      style={{ height: `${depth}svh` }}
    >
      <div
        className={cn(
          'sticky top-0 h-svh w-full overflow-hidden',
          isLight ? 'text-[#0D0D0D]' : 'text-white',
          surface
        )}
      >
        {children}
      </div>
    </section>
  )
}

/**
 * Техническая строка сцены — сегмент направления у правой кромки.
 *
 * Лежит поверх кадра, а не над ним: это разметка на плёнке, а не подзаголовок
 * секции. Ради читаемости на светлом кадре под ней нет плашки — только
 * собственная тень текста.
 *
 * Номера и латинской метки здесь больше нет. Ровно те же «01 COMMERCIAL»
 * стоят в головке таймлайна внизу экрана: два одинаковых слова на одном
 * кадре, разведённые на восемьсот пикселей, читались не как разметка, а как
 * недосмотр. Имя территории называет головка, плёнка — сегмент. Для
 * скринридера номер остаётся: он задаёт порядок, который зрячий получает из
 * делений индекса.
 */
export function StageRail({
  direction,
  theme = 'black',
  meta,
  className,
}: {
  direction: ResolvedDirection
  theme?: 'black' | 'white'
  /**
   * Чем подписана плёнка. null — сцена уже показывает эти бренды сама, и
   * повторять их строкой сверху значит печатать один и тот же список дважды
   * на одном кадре.
   */
  meta?: string | null
  className?: string
}) {
  const isLight = theme === 'white'

  return (
    <div
      className={cn(
        'type-meta pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end px-6 pt-24 font-mono uppercase md:px-10 md:pt-28',
        isLight ? 'text-black/50' : 'text-white/50 [text-shadow:0_1px_18px_rgba(0,0,0,0.6)]',
        className
      )}
    >
      <span className="sr-only">
        Направление {direction.index}: {direction.title}.{' '}
      </span>
      {meta === null ? null : (
        <span className="max-w-[72%] text-right lg:pr-10">{meta ?? direction.meta}</span>
      )}
    </div>
  )
}

/**
 * Заголовок территории.
 *
 * Отдельный компонент ради одной гарантии: у каждой сцены ровно один h2 с
 * предсказуемым id для aria-labelledby. Кегль, разбивка и поведение —
 * целиком дело сцены, в этом и есть разница между территориями.
 */
export function StageTitle({
  id,
  className,
  leading = 0.82,
  children,
}: {
  id: string
  className?: string
  /** Интерлиньяж заголовка территории */
  leading?: number
  children: ReactNode
}) {
  return (
    <h2
      id={`${id}-title`}
      /*
       * Интерлиньяж задан стилем, а не классом, и это не вкусовщина.
       * tailwind-merge считает `text-[<длина>]` сокращённой записью
       * «размер/интерлиньяж» и вычищает из набора любой leading-*, который
       * пришёл раньше. Сцены задают кегль через text-[clamp(...)], поэтому
       * класс leading-[0.82] молча пропадал, и все семь заголовков рисовались
       * с полуторным интервалом вместо плотного набора.
       */
      style={{ lineHeight: leading }}
      className={cn('font-stage uppercase tracking-[-0.03em]', className)}
    >
      {children}
    </h2>
  )
}

/**
 * Нижняя строка сцены: CTA слева, доказательство справа.
 *
 * Одна на семь территорий, потому что раньше её было семь. Каждая сцена
 * выписывала одну и ту же раскладку своими руками, и значения разошлись:
 * gap-y-4 против gap-y-5, mt-7 против mt-8 — но главное, все семь стояли на
 * `items-end`. Выравнивание по нижней кромке боксов у строки, где слева
 * ссылка с подчёркиванием, а справа голый текст, опускает правую часть на
 * одиннадцать пикселей ниже левой. Это ровно тот случай, когда «почти
 * совпадает» хуже намеренной асимметрии: здесь выравнивание по базовой линии.
 */
export function SceneFoot({
  cta,
  aside,
  className,
}: {
  cta: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4', className)}
    >
      {cta}
      {aside}
    </div>
  )
}

/**
 * Кредит работы в нижней строке сцены. Один класс вместо шести копий.
 */
export function SceneCredit({
  href,
  onClick,
  theme = 'black',
  children,
}: {
  href: string
  onClick?: () => void
  theme?: 'black' | 'white'
  children: ReactNode
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      /* Строка кредита набрана в 10 пикселей и раньше нажималась в те же
         десять: зона касания растянута псевдоэлементом, сама строка не
         сдвигается */
      className={cn(
        'type-meta relative font-mono uppercase transition-colors hover:text-accent',
        "before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-['']",
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
        theme === 'white' ? 'text-black/50' : 'text-white/50'
      )}
    >
      {children}
    </a>
  )
}
