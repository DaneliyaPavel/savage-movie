/**
 * Текстовый блок главной: H2 про видеопродакшн в СПб и Москве и обычные ссылки
 * на все опубликованные направления (см. комментарий в home-intro.tsx).
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SERVICE_DIRECTIONS } from '@/lib/services/directions'
import { HomeIntro } from '../home-intro'

describe('HomeIntro', () => {
  it('содержит H2 с географией и специализацией', () => {
    render(<HomeIntro />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/Видеопродакшн/)
    expect(heading.textContent).toMatch(/Санкт-Петербурге и Москве/)
  })

  it('ссылается на каждое опубликованное направление обычным <a href>', () => {
    const { container } = render(<HomeIntro />)
    for (const direction of SERVICE_DIRECTIONS.filter(d => d.route.published)) {
      const link = container.querySelector(`a[href="${direction.route.path}"]`)
      expect(link?.tagName, direction.route.path).toBe('A')
      expect(link?.textContent).toContain(direction.title)
    }
  })

  it('ведёт на смету и в портфолио', () => {
    const { container } = render(<HomeIntro />)
    expect(container.querySelector('a[href="/reklamny-rolik#estimate"]')).not.toBeNull()
    expect(container.querySelector('a[href="/projects"]')).not.toBeNull()
  })
})
