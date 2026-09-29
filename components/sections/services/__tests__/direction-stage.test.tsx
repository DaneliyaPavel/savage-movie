import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SERVICE_DIRECTIONS } from '@/lib/services/directions'
import type { ResolvedDirection } from '@/lib/services/proof'

import { DirectionStage } from '../direction-stage'

vi.mock('../scene-media', () => ({ SceneMedia: () => null }))

const directions: ResolvedDirection[] = SERVICE_DIRECTIONS.map(direction => ({
  ...direction,
  route: direction.route.published ? direction.route : { path: '', published: false },
  works: [],
}))

function setup() {
  return render(
    <DirectionStage
      directions={directions}
      onOpen={vi.fn()}
      onBrief={vi.fn()}
      onNavigate={vi.fn()}
      onCaseOpen={vi.fn()}
    />
  )
}

describe('DirectionStage', () => {
  it('держит в разметке все семь направлений, активно первое', () => {
    setup()
    const panels = Array.from(document.querySelectorAll('[data-direction]'))
    expect(panels).toHaveLength(7)
    expect(panels.filter(node => node.getAttribute('data-current') === 'true')).toHaveLength(1)
    expect(panels[0]?.getAttribute('data-current')).toBe('true')

    // Текст неактивных направлений остаётся в DOM: его видят поиск и скринридер
    for (const direction of directions) {
      expect(screen.getAllByText(direction.description).length).toBeGreaterThan(0)
    }
  })

  it('прячет неактивные панели через visibility, а не убирает из разметки', () => {
    setup()
    const panels = Array.from(document.querySelectorAll('[data-direction]'))
    expect(panels[0]?.className).not.toContain('invisible')
    for (const panel of panels.slice(1)) {
      expect(panel.className).toContain('invisible')
    }
  })

  it('CTA опубликованного направления — ссылка, остальных — кнопка в бриф', () => {
    setup()
    const link = screen.getByRole('link', { name: /Как мы снимаем рекламу/ })
    expect(link.getAttribute('href')).toBe('/reklamny-rolik')
    expect(screen.getAllByRole('button', { name: /Обсудить съёмку коллекции/ })).toHaveLength(1)
  })
})
