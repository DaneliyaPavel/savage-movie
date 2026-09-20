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
 * Техническая строка сцены — номер с меткой слева, сегмент справа.
 *
 * Лежит поверх кадра, а не над ним: это разметка на плёнке, а не подзаголовок
 * секции. Ради читаемости на светлом кадре под ней нет плашки — только
 * собственная тень текста.
 */
export function StageRail({
  direction,
  theme = 'black',
  className,
}: {
  direction: ResolvedDirection
  theme?: 'black' | 'white'
  className?: string
}) {
  const isLight = theme === 'white'

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 pt-24 font-mono text-[0.58rem] uppercase tracking-[0.24em] md:px-10 md:pt-28 md:text-[0.68rem] lg:px-20',
        isLight ? 'text-black/55' : 'text-white/60 [text-shadow:0_1px_18px_rgba(0,0,0,0.6)]',
        className
      )}
    >
      <span>
        <span aria-hidden="true">{direction.index}</span>
        <span className="sr-only">Направление {direction.index}: </span>
        <span className="pl-3">{direction.label}</span>
      </span>
      <span className="text-right">{direction.meta}</span>
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
      className={cn('font-brand uppercase tracking-[-0.03em]', className)}
    >
      {children}
    </h2>
  )
}
