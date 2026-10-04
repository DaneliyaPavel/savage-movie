/**
 * Вертикальные работы в горизонтальной рамке (/projects): по бокам кадра должен быть цвет
 * фона сайта. Раньше LQIP и средний цвет кадра тянулись на всю рамку и рисовали по бокам
 * размытые цветные полосы.
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { MotionSurface } from '../motion-surface'
import { getMediaSpec } from '@/lib/media/manifest'

function rootOf(props: Partial<React.ComponentProps<typeof MotionSurface>>) {
  const { container } = render(<MotionSurface name="project-card" {...props} />)
  return container.querySelector('.sm-root') as HTMLElement
}

describe('MotionSurface: заливка по бокам при fit="contain"', () => {
  const spec = getMediaSpec('project-naumi')

  it('в манифесте есть запись с LQIP для проверки', () => {
    expect(spec?.lqip).toBeTruthy()
    expect(spec?.color).toBeTruthy()
  })

  it('contain: фон сайта вместо цвета кадра, LQIP только под самим кадром', () => {
    const root = rootOf({ spec, fit: 'contain' })
    expect(root.style.getPropertyValue('--sm-fit')).toBe('contain')
    expect(root.style.backgroundColor).toBe('var(--background)')
    expect(root.style.backgroundSize).toBe('contain')
  })

  it('contain без записи в манифесте тоже фон сайта', () => {
    const root = rootOf({ spec: null, fallbackPoster: '/placeholder.svg', fit: 'contain' })
    expect(root.style.backgroundColor).toBe('var(--background)')
  })

  it('cover: средний цвет кадра и LQIP на всю рамку, как раньше', () => {
    const root = rootOf({ spec, fit: 'cover' })
    expect(root.style.getPropertyValue('--sm-fit')).toBe('')
    expect(root.style.backgroundColor).not.toBe('var(--background)')
    expect(root.style.backgroundImage).toContain('data:image/webp')
    expect(root.style.backgroundSize).toBe('')
  })
})
