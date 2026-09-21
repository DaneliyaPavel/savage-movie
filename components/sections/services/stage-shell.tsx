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

  return (
    <section
      id={id}
      ref={containerRef}
      data-stage={direction.id}
      data-stage-theme={theme}
      aria-labelledby={`${id}-title`}
      className="relative"
      style={{ height: `${depth}svh` }}
    >
      <div
        className={cn(
          'sticky top-0 h-svh w-full overflow-hidden',
          isLight ? 'bg-white text-[#0D0D0D]' : 'bg-[#0D0D0D] text-white',
          surfaceClassName
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
        'pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end px-6 pt-24 font-mono text-[0.58rem] uppercase tracking-[0.24em] md:px-10 md:pt-28 md:text-[0.68rem]',
        isLight ? 'text-black/45' : 'text-white/45 [text-shadow:0_1px_18px_rgba(0,0,0,0.6)]',
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
