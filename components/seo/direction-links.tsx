/**
 * Блок «куда дальше» для страниц, которые сами не продают: статей блога и кейсов.
 *
 * Зачем. Статья «Сколько стоит рекламный ролик» — главный источник показов
 * сайта в Google, но ссылок на коммерческие страницы в ней не было, а у кейсов
 * единственным выходом был список проектов. Здесь обычные <a href> на лендинг
 * со сметой и на страницы направлений: и читателю путь к заявке, и роботу
 * внутренние ссылки с анкорами по теме.
 *
 * Компонент без хуков и состояния: годится и в серверных, и в клиентских
 * страницах. Список направлений берётся из lib/services/directions.ts —
 * единственного источника правды о том, какие страницы опубликованы.
 */
import Link from 'next/link'

import { SERVICE_DIRECTIONS, SERVICES_BRIEF_ANCHOR } from '@/lib/services/directions'

interface DirectionLinksProps {
  /** Заголовок над ссылкой на смету */
  eyebrow?: string
  /** Показывать ли ссылку на смету; false — только список «другие форматы» */
  showEstimate?: boolean
  /** Путь направления, которое не надо дублировать в списке «другие форматы» */
  exclude?: string
  className?: string
}

const COMMERCIAL = SERVICE_DIRECTIONS.find(direction => direction.id === 'commercial')

export function DirectionLinks({
  eyebrow = 'Считаете бюджет?',
  showEstimate = true,
  exclude,
  className = '',
}: DirectionLinksProps) {
  const others = SERVICE_DIRECTIONS.filter(
    direction =>
      direction.route.published && direction.id !== 'commercial' && direction.route.path !== exclude
  )

  return (
    <aside aria-label="Заказать видео" className={className}>
      {showEstimate && (
        <>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
          <Link
            href={`${COMMERCIAL?.route.path ?? '/reklamny-rolik'}#${SERVICES_BRIEF_ANCHOR}`}
            className="group mt-3 inline-block text-2xl font-bold leading-tight tracking-tight transition-colors hover:text-[#ff2936] md:text-3xl"
          >
            Получить предварительную смету на рекламный ролик
            <span
              aria-hidden="true"
              className="ml-2 inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </>
      )}

      <p
        className={`text-xs uppercase tracking-[0.25em] text-muted-foreground ${showEstimate ? 'mt-8' : ''}`}
      >
        Другие форматы
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-base">
        {others.map(direction => (
          <li key={direction.id}>
            <Link
              href={direction.route.path}
              className="text-foreground/75 underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-[#ff2936] hover:decoration-[#ff2936]"
            >
              {direction.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
