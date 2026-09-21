'use client'

import { cn } from '@/lib/utils'
import type { ResolvedDirection } from '@/lib/services/proof'

/**
 * Единственный постоянный элемент интерфейса раздела.
 *
 * Это не подпись дизайнера, а головка таймлайна: семь делений показывают, где
 * человек находится в последовательности, подпись называет текущую территорию,
 * а нажатие перематывает к нужной. На странице из семи экранных состояний без
 * этого невозможно вернуться к своему — и невозможно понять, сколько ещё
 * осталось.
 *
 * Живёт одинаково на всех размерах: внизу, поперёк экрана. Отдельной
 * мобильной версии у него нет намеренно — деления и так узкие, а перенос
 * навигации в другое место ломал бы привычку, набранную на десктопе.
 *
 * Пока активной территории нет — человек на первом экране или уже в брифе —
 * головка скрыта: объявлять «01 COMMERCIAL» над вопросом о задаче значит
 * отвечать раньше вопроса.
 */
export interface ProductionIndexProps {
  directions: readonly ResolvedDirection[]
  activeId: string | null
  sceneId: (direction: ResolvedDirection) => string
  /** Тема активной сцены: на белой инверсии головка обязана оставаться читаемой */
  theme: 'black' | 'white'
}

export function ProductionIndex({ directions, activeId, sceneId, theme }: ProductionIndexProps) {
  const isLight = theme === 'white'
  const active = directions.find(direction => sceneId(direction) === activeId) ?? null

  return (
    <nav
      aria-label="Направления производства"
      aria-hidden={active ? undefined : true}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 px-6 pb-5 transition-opacity duration-500 md:px-10 lg:px-20',
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <span
        className={cn(
          'w-[9.5rem] shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.24em] transition-colors md:text-[0.66rem]',
          isLight ? 'text-black/60' : 'text-white/70'
        )}
      >
        {active ? `${active.index} ${active.label}` : ''}
      </span>

      <ul className="flex flex-1 items-center gap-1.5">
        {directions.map(direction => {
          const id = sceneId(direction)
          const isActive = activeId === id

          return (
            <li key={direction.id} className="flex-1">
              <a
                href={`#${id}`}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`${direction.index} — ${direction.title}`}
                className={cn(
                  'block h-3 pt-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                )}
              >
                {/*
                  Активное деление отмечено толщиной и полной плотностью, а не
                  цветом. Красный на этой странице — одно событие в монтаже
                  («Не один ролик»), и если он же подсвечивает деление на
                  каждом из семи экранов, событие перестаёт быть событием.
                */}
                <span
                  className={cn(
                    'block w-full transition-all duration-300',
                    isActive ? 'h-[2px]' : 'h-px',
                    isActive
                      ? isLight
                        ? 'bg-black'
                        : 'bg-white'
                      : isLight
                        ? 'bg-black/20 hover:bg-black/45'
                        : 'bg-white/20 hover:bg-white/50'
                  )}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
