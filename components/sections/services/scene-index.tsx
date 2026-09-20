'use client'

import { cn } from '@/lib/utils'
import type { ResolvedDirection } from '@/lib/services/proof'

/**
 * Индекс направлений у левой кромки — единственный постоянный элемент
 * интерфейса на всём монтаже.
 *
 * Он не украшение: это таймлайн. Номер активной сцены сообщает, где человек
 * находится в последовательности, а клик по номеру перематывает к нужному
 * направлению — на длинной странице из семи полноэкранных сцен без этого
 * невозможно вернуться к своему.
 *
 * Рука. Активный номер подчёркнут нарисованным от руки штрихом — одно место
 * на странице, где система перестаёт быть машинной. Штрих перерисовывается
 * при каждой смене сцены, поэтому у него нет анимации входа: он просто
 * оказывается там же, где оказался кадр.
 *
 * Пока активной сцены нет — человек ещё на первом экране — колонка скрыта:
 * заявлять «01 COMMERCIAL» над заголовком, который спрашивает про задачу,
 * значит отвечать раньше вопроса. Скрыта именно прозрачностью, а не
 * размонтированием: так у неё не дёргается раскладка на каждом входе.
 *
 * На мобильных индекса нет: его роль там играет верхняя строка самой сцены
 * (SceneFrame), а фиксированная колонка съедала бы и без того узкое поле.
 */
export interface SceneIndexProps {
  directions: readonly ResolvedDirection[]
  activeId: string | null
  /** id сцены по направлению — совпадает с sceneId() на странице */
  sceneId: (direction: ResolvedDirection) => string
  /** Тема активной сцены: на белой инверсии индекс обязан оставаться читаемым */
  theme: 'black' | 'white'
}

function HandStroke({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 8"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none absolute -bottom-1 left-0 h-2 w-9', className)}
      preserveAspectRatio="none"
    >
      <path
        d="M1,5.4 C8,2.6 14,6.2 20,4.1 C26.5,1.9 32,5.8 39,3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SceneIndex({ directions, activeId, sceneId, theme }: SceneIndexProps) {
  const isLight = theme === 'white'

  return (
    <nav
      aria-label="Направления производства"
      aria-hidden={activeId ? undefined : true}
      className={cn(
        'pointer-events-none fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 pl-5 transition-opacity duration-500 lg:block xl:pl-7',
        activeId ? 'opacity-100' : 'opacity-0'
      )}
    >
      <ul className="flex flex-col gap-4">
        {directions.map(direction => {
          const id = sceneId(direction)
          const isActive = activeId === id

          return (
            <li key={direction.id} className={cn(activeId && 'pointer-events-auto')}>
              <a
                href={`#${id}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'group relative inline-flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.24em] transition-colors duration-300',
                  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
                  isActive
                    ? isLight
                      ? 'text-[#0D0D0D]'
                      : 'text-white'
                    : isLight
                      ? 'text-black/30 hover:text-black/60'
                      : 'text-white/30 hover:text-white/60'
                )}
              >
                <span className="relative">
                  {direction.index}
                  {isActive ? <HandStroke className="text-accent" /> : null}
                </span>
                {/* Метка направления появляется только у активного: в покое
                    колонка остаётся цифрами и не спорит с кадром */}
                <span
                  className={cn(
                    'transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  )}
                >
                  {direction.label}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
