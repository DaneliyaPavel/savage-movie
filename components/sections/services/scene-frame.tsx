'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { ResolvedDirection } from '@/lib/services/proof'

/**
 * Оболочка сцены направления.
 *
 * Сознательно отвечает только за постоянное: полноэкранную секцию, её тему
 * и технические строки по краям — номер с меткой слева и сегмент справа.
 * Композиция внутри — дело самой сцены.
 *
 * Это не шаблон лендинга. Общий каркас нужен, чтобы монтаж читался как один
 * фильм, а не как семь разных страниц подряд; если бы сюда переехали ещё и
 * заголовок с медиа, fashion и beauty отличались бы только текстом — ровно то,
 * чего раздел направлений и должен избежать.
 */
export interface SceneFrameProps {
  id: string
  direction: ResolvedDirection
  /** Инверсия на белом — осознанный слом ритма, а не оформление */
  theme?: 'black' | 'white'
  /** Дополнительные классы секции: высота, выравнивание, паддинги сцены */
  className?: string
  children: ReactNode
}

export function SceneFrame({
  id,
  direction,
  theme = 'black',
  className,
  children,
}: SceneFrameProps) {
  const isLight = theme === 'white'

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-scene={direction.id}
      data-scene-theme={theme}
      className={cn(
        'relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden',
        // Отступ сверху — под фиксированную шапку, снизу — под индекс сцен
        'px-6 pb-16 pt-24 md:px-10 md:pb-20 md:pt-28 lg:px-20',
        isLight ? 'bg-white text-[#0D0D0D]' : 'bg-[#0D0D0D] text-white',
        className
      )}
    >
      {/* Верхняя техническая линия: номер и сегмент по краям одной строки.
          Это метаданные кадра, а не подзаголовок — поэтому моноширинный
          мелкий кегль и линия под ними, а не плашка. */}
      <div
        className={cn(
          'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b pb-3 font-mono text-[0.6rem] uppercase tracking-[0.24em] md:text-[0.7rem]',
          isLight ? 'border-black/15 text-black/55' : 'border-white/15 text-white/55'
        )}
      >
        <span>
          <span aria-hidden="true">{direction.index}</span>
          <span className="sr-only">Направление {direction.index}: </span>
          <span className="pl-3">{direction.label}</span>
        </span>
        <span className="text-right">{direction.meta}</span>
      </div>

      {children}
    </section>
  )
}

/**
 * Заголовок сцены. Отдельный компонент только ради одного: все семь сцен
 * обязаны иметь ровно один h2 с предсказуемым id для aria-labelledby, и это
 * не то, что стоит переписывать семь раз по-разному.
 *
 * Размер и разбивка на строки остаются за сценой — в этом и есть монтаж.
 *
 * data-reveal — единственное движение внутри сцены: заголовок приезжает
 * снизу на общей кривой сайта (см. [data-reveal] в globals.css). Анимируется
 * только transform, поэтому текст виден в первом отрисованном кадре и до
 * гидратации, а при prefers-reduced-motion движения нет вовсе. Появления
 * «по очереди» у копии, CTA и кейсов сознательно нет: fade-in всего подряд
 * превращает монтаж в презентацию.
 */
export function SceneTitle({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  return (
    <h2
      id={`${id}-title`}
      data-reveal=""
      className={cn(
        'font-brand uppercase leading-[0.82] tracking-[-0.03em] text-balance',
        className
      )}
    >
      {children}
    </h2>
  )
}
