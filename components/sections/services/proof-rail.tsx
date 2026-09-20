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
 */
export interface ProofRailProps {
  direction: ResolvedDirection
  works?: DirectionWork[]
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
  theme?: 'black' | 'white'
  className?: string
}

export function ProofRail({
  direction,
  works,
  onCaseOpen,
  theme = 'black',
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
            className={cn(
              'group inline-flex items-baseline gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
              isLight ? 'text-[#0D0D0D] hover:text-accent' : 'text-white hover:text-accent'
            )}
          >
            <span className="text-sm font-medium uppercase tracking-[0.08em] md:text-base">
              {work.client}
            </span>
            <span
              className={cn(
                'font-mono text-[0.6rem] uppercase tracking-[0.18em] transition-colors md:text-[0.68rem]',
                isLight
                  ? 'text-black/45 group-hover:text-accent'
                  : 'text-white/45 group-hover:text-accent'
              )}
            >
              {work.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
