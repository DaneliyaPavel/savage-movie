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
        'fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 px-6 pb-5 md:px-10 lg:px-20',
        'transition-opacity duration-[var(--motion-move)] ease-[var(--ease-out-expo)]',
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      {/*
        Головка лежит поверх произвольного кадра: на светлой части плана белая
        строка и белые деления пропадают целиком. Плашки под ними нет — она
        превратила бы таймлайн в панель интерфейса, — поэтому читаемость
        держит собственная тень, ровно как у технической строки сцены.
      */}
      <span
        className={cn(
          'type-meta w-[9.5rem] shrink-0 font-mono uppercase',
          'transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
          isLight
            ? 'text-black/60 [text-shadow:0_1px_14px_rgba(255,255,255,0.75)]'
            : 'text-white/70 [text-shadow:0_1px_14px_rgba(0,0,0,0.75)]'
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
                /*
                  Деление рисуется в три пикселя, а нажимается в тридцать
                  два: псевдоэлемент растягивает зону касания вверх и вниз,
                  не сдвигая саму линию. Прежние 12px по высоте — меньше
                  минимального размера цели и заметно меньше пальца.
                */
                className={cn(
                  'relative block h-3 pt-1',
                  "before:absolute before:inset-x-0 before:-top-2 before:-bottom-3 before:content-['']",
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
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
                    /*
                      Переход на два конкретных свойства, а не на all. Под all
                      попадали и ширина, и цвет, и всё, что когда-либо
                      добавится: браузер каждый раз ищет, что именно
                      изменилось. Деление меняет только толщину и плотность —
                      и делает это за смену состояния, а не за треть секунды,
                      потому что подсветка деления и смена кадра должны
                      читаться одним событием.
                    */
                    'block w-full transition-[height,background-color] duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
                    isLight
                      ? 'drop-shadow-[0_0_3px_rgba(255,255,255,0.9)]'
                      : 'drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]',
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
