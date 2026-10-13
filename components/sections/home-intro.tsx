/**
 * Текстовый блок главной между hero и футером.
 *
 * Зачем. Главная — страница, на которую сайт получает почти все внешние ссылки
 * и показы по запросам «видеопродакшн в СПб», «реклама видео СПб», но H1 у неё
 * бренд, а текста про специализацию и географию не было вовсе (≈180 слов
 * на всю страницу, по данным Search Console на 13.10.2026 — позиции 4–11 при
 * нулевых кликах). Здесь: что делает студия, где работает и обычные ссылки на
 * все семь направлений — для человека это оглавление, для робота внутренние
 * ссылки с говорящими анкорами.
 *
 * Тексты — пересказ уже опубликованных описаний страниц направлений и /about,
 * новых утверждений (клиенты, сроки, цены, результаты) здесь нет.
 * Первый экран не тронут: блок лежит ниже полноэкранного hero.
 */
import Link from 'next/link'

import { SERVICE_DIRECTIONS, SERVICES_BRIEF_ANCHOR } from '@/lib/services/directions'

/** Одна строка про направление, по id из SERVICE_DIRECTIONS */
const SUMMARY: Record<string, string> = {
  commercial: 'Креатив, сценарий, съёмка, постпродакшн и адаптации для брендов и бизнеса.',
  fashion: 'Фильм к кампании, лукбук в движении, ролики к дропу и вертикальные версии.',
  beauty: 'Текстуры, кожа и свет крупным планом, вертикальные ролики под Reels, Shorts и TikTok.',
  'content-production':
    'Одна съёмка — материалы на квартал: главный ролик, вертикальные версии, видео для сайта и соцсетей.',
  corporate: 'Фильмы о производстве, технологиях и людях компании.',
  ai: 'Живая съёмка, генерация и постпродакшн в одной работе.',
  music: 'Режиссёрская идея, сет-дизайн, съёмка и монтаж под трек.',
}

export function HomeIntro() {
  const directions = SERVICE_DIRECTIONS.filter(direction => direction.route.published)

  return (
    <section
      aria-labelledby="home-intro-title"
      className="relative z-20 border-t border-white/10 bg-background px-6 py-16 md:px-10 md:py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <div className="max-w-md">
          <p className="type-meta text-white/[0.47]">Студия</p>
          <h2
            id="home-intro-title"
            className="font-stage mt-4 text-3xl uppercase leading-[1.02] tracking-tight text-white md:text-5xl"
          >
            Видеопродакшн в Санкт-Петербурге и Москве
          </h2>
          <p className="font-secondary mt-6 text-base leading-relaxed text-white/60">
            Savage Movie — продакшн-студия полного цикла: от идеи и сценария до съёмки,
            постпродакшна и версий для площадок. База в Санкт-Петербурге, съёмки в Москве и по
            России.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link
              href={`/reklamny-rolik#${SERVICES_BRIEF_ANCHOR}`}
              className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
            >
              Получить предварительную смету
            </Link>
            <Link
              href="/projects"
              className="text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
            >
              Смотреть работы
            </Link>
          </div>
        </div>

        <ul className="border-b border-white/10">
          {directions.map(direction => (
            <li key={direction.id} className="border-t border-white/10">
              <Link
                href={direction.route.path}
                className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-5 transition-colors hover:bg-white/[0.03] md:grid-cols-[3rem_1fr_auto] md:py-6"
              >
                <span className="type-meta tabular-nums text-white/[0.47]">{direction.index}</span>
                <span>
                  <span className="font-stage block text-lg uppercase tracking-tight text-white transition-colors group-hover:text-[#ff2936] md:text-xl">
                    {direction.title}
                  </span>
                  <span className="font-secondary mt-1.5 block text-sm leading-relaxed text-white/55">
                    {SUMMARY[direction.id]}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-white/40 transition-all group-hover:translate-x-1 group-hover:text-white"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
