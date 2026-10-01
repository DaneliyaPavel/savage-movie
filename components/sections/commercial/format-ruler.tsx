/**
 * Линейка форматов под этапом «Адаптации»: горизонталь, вертикаль и квадрат
 * рядом, в точных пропорциях. Показывает, что значит «16:9, 9:16, 1:1»: тот же
 * образ, переложенный под разные площадки.
 *
 * Кадры — безымянные иллюстрации из библиотеки сцен, не работа клиента. Подписей
 * у них нет, кроме самих форматов. Декор: плашки этапа уже называют форматы,
 * поэтому блок скрыт от скринридера.
 *
 * Обычный next/image, а не Still из kit направлений: Still тянет за собой
 * direction-kit.css с :root-правилами, а здесь страница с формой заявки.
 */
import Image from 'next/image'

import { sceneFrame } from '@/lib/services/scene-stills'

const WIDE = sceneFrame('desert-road-car')
const TALL = sceneFrame('moto-desert')

/** Ширины колонок равны пропорциям (16/9, 9/16, 1): при одной высоте ряда рамки точные */
const COLUMNS = 'grid grid-cols-[1.778fr_0.5625fr_1fr] gap-2.5 md:gap-3'

const TILES = [
  {
    frame: WIDE,
    label: '16:9',
    className: 'aspect-video',
    sizes: '(min-width: 768px) 22rem, 50vw',
  },
  { frame: TALL, label: '9:16', className: 'h-full', sizes: '(min-width: 768px) 8rem, 20vw' },
  { frame: TALL, label: '1:1', className: 'h-full', sizes: '(min-width: 768px) 13rem, 30vw' },
]

export function FormatRuler() {
  return (
    <figure aria-hidden="true" className="mt-8 w-full max-w-[44rem]">
      <div className={COLUMNS}>
        {TILES.map(tile => (
          <div
            key={tile.label}
            className={`relative overflow-hidden bg-[#0d0d0d] ring-1 ring-white/15 ${tile.className}`}
          >
            <Image
              src={tile.frame.src}
              alt=""
              fill
              quality={65}
              sizes={tile.sizes}
              className="object-cover"
              style={{ objectPosition: tile.frame.position }}
            />
          </div>
        ))}
      </div>
      <div className={`${COLUMNS} mt-2.5`}>
        {TILES.map(tile => (
          <span
            key={tile.label}
            className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-white/55"
          >
            {tile.label}
          </span>
        ))}
      </div>
    </figure>
  )
}
