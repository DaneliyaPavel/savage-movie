'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { DirectionWork, ResolvedDirection } from '@/lib/services/proof'

/**
 * Работы-доказательства направления одной строкой.
 *
 * Заголовок и копия — это заявление; строка ниже — то, чем оно подтверждается.
 * Каждый элемент ведёт на реальную страницу проекта, и попасть сюда может
 * только работа, найденная в портфолио (см. lib/services/proof.ts).
 *
 * Бренд набран крупнее названия работы намеренно: человек ищет глазами
 * знакомое имя, а не заголовок ролика.
 *
 * brandsOnly убирает названия работ совсем. На полноэкранной сцене четыре
 * пары «бренд + название» — это восемь объектов вдоль нижней кромки, которые
 * спорят с CTA за тот же взгляд; знакомое имя в этой строке и так делает всю
 * работу, а «Шесть утра» и «Ух ты, парк» полностью перечислены в
 * спецификации ниже по странице.
 */
export interface ProofRailProps {
  direction: ResolvedDirection
  works?: DirectionWork[]
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
  theme?: 'black' | 'white'
  /** Только имена брендов, без названий работ */
  brandsOnly?: boolean
  className?: string
}

export function ProofRail({
  direction,
  works,
  onCaseOpen,
  theme = 'black',
  brandsOnly = false,
  className,
}: ProofRailProps) {
  const items = works ?? direction.works
  if (items.length === 0) return null

  const isLight = theme === 'white'

  return (
    <ul className={cn('flex flex-wrap items-baseline gap-x-8 gap-y-3', className)}>
      {items.map(work => (
        <li key={work.slug}>
          <Link
            href={`/projects/${work.slug}`}
            onClick={() => onCaseOpen(direction, work.slug)}
            /* Строка доказательств высотой в набор; зона касания растянута
               ровно до соседнего ряда и ни на пиксель дальше */
            className={cn(
              'group relative inline-flex items-baseline gap-2 transition-colors',
              "before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
              'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
              isLight ? 'text-[#0D0D0D] hover:text-accent' : 'text-white hover:text-accent'
            )}
          >
            <span className="text-sm font-medium uppercase tracking-[0.08em] md:text-base">
              {work.client}
            </span>
            {brandsOnly ? (
              <span className="sr-only">{work.title}</span>
            ) : (
              <span
                className={cn(
                  'type-meta font-mono uppercase transition-colors',
                  isLight
                    ? 'text-black/50 group-hover:text-accent'
                    : 'text-white/50 group-hover:text-accent'
                )}
              >
                {work.title}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
