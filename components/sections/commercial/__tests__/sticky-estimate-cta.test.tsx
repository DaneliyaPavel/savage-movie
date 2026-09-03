/**
 * Плавающий CTA. Основная логика видимости (порог скролла) уже была верной —
 * проверяем то, что реально было дефектом: `hidden` должен полностью убирать
 * кнопку из DOM независимо от скролла, чтобы client.tsx мог погасить её и
 * рядом с формой, и у футера, и после успешной отправки заявки одним и тем
 * же пропом.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { StickyEstimateCta } from '../sticky-estimate-cta'

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true })
  fireEvent.scroll(window)
}

describe('StickyEstimateCta', () => {
  it('не показывается, пока не проскроллили достаточно вниз', () => {
    setScrollY(0)
    render(<StickyEstimateCta label="Получить смету" onClick={() => undefined} />)

    expect(screen.queryByRole('button', { name: /Получить смету/ })).not.toBeInTheDocument()
  })

  it('появляется после прокрутки мимо первого экрана', () => {
    render(<StickyEstimateCta label="Получить смету" onClick={() => undefined} />)
    setScrollY(2000)

    expect(screen.getAllByRole('button', { name: /Получить смету/ }).length).toBeGreaterThan(0)
  })

  it('hidden убирает кнопку из DOM, даже если условие скролла выполнено', () => {
    render(<StickyEstimateCta label="Получить смету" onClick={() => undefined} hidden />)
    setScrollY(2000)

    expect(screen.queryByRole('button', { name: /Получить смету/ })).not.toBeInTheDocument()
  })

  it('появление у порога скролла — плавный переход, а не жёсткий mount/unmount', () => {
    // Раньше кнопка монтировалась/размонтировалась мгновенно при пересечении
    // порога скролла — хлопок по экрану. Теперь под порогом она остаётся
    // в DOM (просто visually hidden через opacity/translate), поэтому
    // при появлении её видит переход, а не condicional render с нуля.
    setScrollY(0)
    const { container } = render(
      <StickyEstimateCta label="Получить смету" onClick={() => undefined} />
    )

    const desktopButton = container.querySelector('button.md\\:inline-flex')!
    expect(desktopButton).toBeInTheDocument()
    expect(desktopButton.className).toMatch(/opacity-0/)
    expect(desktopButton).toHaveAttribute('aria-hidden', 'true')
    expect(desktopButton).toHaveAttribute('tabindex', '-1')

    setScrollY(2000)

    expect(desktopButton.className).toMatch(/opacity-100/)
    expect(desktopButton).toHaveAttribute('aria-hidden', 'false')
    expect(desktopButton).toHaveAttribute('tabindex', '0')
  })
})
