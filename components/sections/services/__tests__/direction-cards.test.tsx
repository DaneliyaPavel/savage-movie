import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { SERVICE_DIRECTIONS } from '@/lib/services/directions'
import type { ResolvedDirection } from '@/lib/services/proof'

import { DirectionCards } from '../direction-cards'

vi.mock('../scene-media', () => ({ SceneMedia: () => null }))

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ??
    ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList)
})

const directions: ResolvedDirection[] = SERVICE_DIRECTIONS.map(direction => ({
  ...direction,
  route: direction.route.published ? direction.route : { path: '', published: false },
  works: [],
}))

function setup() {
  return render(
    <DirectionCards
      directions={directions}
      onOpen={vi.fn()}
      onBrief={vi.fn()}
      onNavigate={vi.fn()}
      onCaseOpen={vi.fn()}
    />
  )
}

describe('DirectionCards', () => {
  it('держит в разметке все семь карточек, текущая первая', () => {
    setup()
    const cards = Array.from(document.querySelectorAll('[data-direction]'))
    expect(cards).toHaveLength(7)
    expect(cards[0]?.getAttribute('data-current')).toBe('true')
    expect(cards.filter(node => node.getAttribute('data-current') === 'true')).toHaveLength(1)

    // Текст каждой карточки есть в DOM: его видят поиск и скринридер
    for (const direction of directions) {
      expect(screen.getAllByText(direction.description).length).toBeGreaterThan(0)
      expect(screen.getByRole('heading', { name: new RegExp(direction.title) })).toBeTruthy()
    }
  })

  it('карточки залипают друг под другом на высоту полосы', () => {
    setup()
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-direction]'))
    expect(cards[0]?.className).toContain('sticky')
    expect(cards[3]?.getAttribute('style')).toContain('3 * var(--deck)')
  })

  it('CTA опубликованного направления — ссылка, остальных — кнопка в бриф', () => {
    setup()
    const link = screen.getByRole('link', { name: /Как мы снимаем рекламу/ })
    expect(link.getAttribute('href')).toBe('/reklamny-rolik')
    expect(screen.getAllByRole('button', { name: /Обсудить съёмку коллекции/ })).toHaveLength(1)
  })
})
