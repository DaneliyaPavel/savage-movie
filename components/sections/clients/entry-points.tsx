/**
 * Блок, который снимает главный страх первого контакта: «мне нечего показать,
 * у меня нет сценария». Три реальные точки входа, без описания процесса —
 * процесс живёт на /reklamny-rolik, здесь достаточно разрешения написать.
 *
 * Server Component: текст статичный, анимировать нечего.
 */
const ENTRY_POINTS = [
  {
    title: 'Только задача',
    body: 'Знаете, что нужно продать или показать, но не знаете, как это снять. Дальше — наша работа.',
  },
  {
    title: 'Идея и референсы',
    body: 'Есть направление и папка со ссылками. Собираем из этого продакшн, а не пересъёмку чужого ролика.',
  },
  {
    title: 'Готовый бриф',
    body: 'Бриф согласован внутри. Читаем, задаём вопросы, считаем смету и сроки.',
  },
]

export function EntryPoints() {
  return (
    <section className="border-t border-white/10 px-5 py-20 sm:px-8 md:px-10 md:py-28 lg:px-16">
      <h2 className="max-w-[16ch] font-brand-hero text-[clamp(1.9rem,6vw,4rem)] uppercase leading-[0.95] tracking-tighter text-white">
        Сценарий не обязателен
      </h2>

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
        {ENTRY_POINTS.map(point => (
          <div key={point.title} className="border-t border-white/20 pt-5">
            <h3 className="text-[11px] uppercase tracking-[0.28em] text-white">{point.title}</h3>
            <p className="mt-4 max-w-[42ch] text-[15px] font-light leading-relaxed text-white/65 md:text-base">
              {point.body}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-12 max-w-[46ch] text-lg font-light leading-relaxed text-white/80 md:mt-16 md:text-xl">
        Подключаемся на любом из трёх этапов.
      </p>
    </section>
  )
}
