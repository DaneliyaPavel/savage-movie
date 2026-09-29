import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SERVICE_DIRECTIONS } from '@/lib/services/directions'
import type { ResolvedDirection } from '@/lib/services/proof'

import { DirectionRoll } from '../direction-roll'

vi.mock('../scene-media', () => ({ SceneMedia: () => null }))

const directions: ResolvedDirection[] = SERVICE_DIRECTIONS.map(direction => ({
  ...direction,
  route: direction.route.published ? direction.route : { path: '', published: false },
  works: [],
}))

function setup() {
  const handlers = {
    onOpen: vi.fn(),
    onBrief: vi.fn(),
    onNavigate: vi.fn(),
    onCaseOpen: vi.fn(),
  }
  render(<DirectionRoll directions={directions} {...handlers} />)
  return handlers
}

describe('DirectionRoll', () => {
  it('держит в разметке все семь направлений, раскрыто одно', () => {
    setup()
    const triggers = screen
      .getAllByRole('button', { expanded: undefined })
      .filter(node => node.id.endsWith('-trigger'))
    expect(triggers).toHaveLength(7)
    expect(triggers.filter(node => node.getAttribute('aria-expanded') === 'true')).toHaveLength(1)
    // Текст закрытых строк остаётся в DOM: его видят поиск и скринридер
    for (const direction of directions) {
      expect(screen.getAllByText(direction.description).length).toBeGreaterThan(0)
    }
  })

  it('раскрывает строку по нажатию и сообщает об этом один раз', () => {
    const { onOpen } = setup()
    const fashion = document.getElementById('direction-fashion-trigger') as HTMLElement

    fireEvent.click(fashion)
    expect(fashion.getAttribute('aria-expanded')).toBe('true')
    expect(
      document.getElementById('direction-commercial-trigger')?.getAttribute('aria-expanded')
    ).toBe('false')
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen.mock.calls[0]?.[0].id).toBe('fashion')

    // Закрытие строки не считается просмотром
    fireEvent.click(fashion)
    expect(fashion.getAttribute('aria-expanded')).toBe('false')
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('CTA неопубликованного направления открывает бриф, а не ведёт по ссылке', () => {
    const { onBrief } = setup()
    fireEvent.click(document.getElementById('direction-fashion-trigger') as HTMLElement)
    fireEvent.click(screen.getByRole('button', { name: /Обсудить съёмку коллекции/ }))
    expect(onBrief).toHaveBeenCalledTimes(1)
    expect(onBrief.mock.calls[0]?.[0].id).toBe('fashion')
  })
})
