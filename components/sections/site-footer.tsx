/**
 * Site footer главной страницы.
 *
 * Зачем он существует. До него единственной навигацией главной был
 * JalousieMenu, который монтирует <nav> только при isOpen — то есть ссылок не
 * было ни в SSR-HTML, ни в DOM после гидратации, пока пользователь не нажмёт
 * «Меню». Роботы кликов не делают, поэтому главная — страница, на которую сайт
 * получает почти все внешние ссылки, — не передавала вес ни одной коммерческой
 * странице: все её 19 ссылок вели на /projects/*.
 *
 * Здесь обычные <a href>, видимые человеку и роботу одинаково. Ничего не
 * спрятано через display:none, sr-only или нулевую высоту: скрытая ради поиска
 * навигация — это то, за что снимают, а не то, за что ранжируют.
 *
 * Первый экран не тронут: hero остаётся h-svh, футер лежит ниже сгиба и
 * открывается скроллом. JalousieMenu остаётся как основная интеракция.
 */
'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n-context'
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contacts'

/** Колонки футера. Анкоры — из nav.*, теми же словами, что и в меню. */
const COLUMNS: ReadonlyArray<{
  titleKey: string
  links: ReadonlyArray<{ href: string; labelKey: string }>
}> = [
  {
    titleKey: 'siteFooter.work',
    links: [
      { href: '/projects', labelKey: 'nav.projects' },
      { href: '/clients', labelKey: 'nav.clients' },
    ],
  },
  {
    titleKey: 'siteFooter.services',
    links: [
      { href: '/reklamny-rolik', labelKey: 'nav.commercial' },
      { href: '/services', labelKey: 'nav.services' },
      { href: '/blog', labelKey: 'nav.blog' },
    ],
  },
  {
    titleKey: 'siteFooter.studio',
    links: [
      { href: '/about', labelKey: 'nav.studio' },
      { href: '/contact', labelKey: 'nav.contact' },
      { href: '/booking', labelKey: 'nav.booking' },
    ],
  },
]

export function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="relative z-20 border-t border-white/10 bg-background px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:gap-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-10">
          {/* Бренд + одна строка позиционирования с контекстной ссылкой */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-brand text-2xl uppercase tracking-tight text-white transition-opacity hover:opacity-70 md:text-3xl"
            >
              Savage Movie
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              {t('siteFooter.lead')}{' '}
              <Link
                href="/reklamny-rolik"
                className="text-white/80 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
              >
                {t('siteFooter.leadLink')}
              </Link>{' '}
              {t('siteFooter.leadTail')}
            </p>
          </div>

          {COLUMNS.map(column => (
            <nav key={column.titleKey} aria-label={t(column.titleKey)}>
              <h2 className="mb-4 text-[11px] uppercase tracking-[0.25em] text-white/35">
                {t(column.titleKey)}
              </h2>
              <ul className="space-y-2.5">
                {column.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-5">
            <a
              href={PHONE_HREF}
              className="tracking-[0.15em] uppercase transition-colors hover:text-white/70"
            >
              {PHONE_DISPLAY}
            </a>
            <a
              href={EMAIL_HREF}
              className="tracking-[0.15em] uppercase transition-colors hover:text-white/70"
            >
              {EMAIL}
            </a>
          </div>
          <p className="tracking-[0.15em] uppercase">{t('footer.location')}</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-white/70">
              {t('siteFooter.privacy')}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white/70">
              {t('siteFooter.terms')}
            </Link>
            <span>© {new Date().getFullYear()} Savage Movie</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
