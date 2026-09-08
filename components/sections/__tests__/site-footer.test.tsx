/**
 * Стереж краулимой навигации главной.
 *
 * История: единственной навигацией главной был JalousieMenu, который монтирует
 * <nav> только при isOpen. В отрендеренном DOM главной было 19 внутренних
 * ссылок, и все вели на /projects/*. Ни /reklamny-rolik, ни /services, ни
 * /clients с главной достижимы не были — ни для человека без клика по «Меню»,
 * ни для робота вообще.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '@/lib/i18n-context'
import { SiteFooter } from '../site-footer'

/** Маршруты, без которых главная снова становится тупиком. */
const REQUIRED_HREFS = [
  '/reklamny-rolik',
  '/services',
  '/projects',
  '/clients',
  '/about',
  '/blog',
  '/contact',
  '/booking',
] as const

function renderFooter() {
  return render(
    <I18nProvider>
      <SiteFooter />
    </I18nProvider>
  )
}

describe('SiteFooter', () => {
  it.each(REQUIRED_HREFS)('содержит ссылку на %s', href => {
    renderFooter()
    expect(document.querySelector(`a[href="${href}"]`)).not.toBeNull()
  })

  it('ссылки — настоящие <a href>, а не кнопки с обработчиком', () => {
    renderFooter()
    for (const href of REQUIRED_HREFS) {
      const link = document.querySelector(`a[href="${href}"]`)
      expect(link?.tagName).toBe('A')
      expect(link?.textContent?.trim()).not.toBe('')
    }
  })

  it('ничего не спрятано ради поиска', () => {
    const { container } = renderFooter()
    for (const link of Array.from(container.querySelectorAll('a'))) {
      const el = link as HTMLElement
      expect(el.style.display).not.toBe('none')
      expect(el.style.visibility).not.toBe('hidden')
      expect(el.className).not.toMatch(/\bsr-only\b|\bhidden\b/)
      expect(el.getAttribute('aria-hidden')).not.toBe('true')
    }
  })

  it('даёт контекстную ссылку на коммерческую посадочную с описательным анкором', () => {
    renderFooter()
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href="/reklamny-rolik"]')
    )
    expect(links.length).toBeGreaterThanOrEqual(2)

    // Хотя бы один анкор — фраза, а не одно слово навигации.
    const anchors = links.map(l => l.textContent?.trim() ?? '')
    expect(anchors.some(a => a.split(/\s+/).length >= 3)).toBe(true)
  })

  it('рендерится как <footer> и содержит навигационные группы', () => {
    const { container } = renderFooter()
    expect(container.querySelector('footer')).not.toBeNull()
    expect(container.querySelectorAll('nav').length).toBeGreaterThanOrEqual(3)
  })

  it('переключается на английский вместе с остальным сайтом', () => {
    renderFooter()
    // В русской локали анкор коммерческой посадочной — из nav.commercial.
    expect(screen.getAllByText('Рекламные ролики').length).toBeGreaterThanOrEqual(1)
  })
})
