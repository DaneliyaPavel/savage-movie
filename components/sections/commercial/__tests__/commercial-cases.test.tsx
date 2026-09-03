/**
 * Кейсы на лендинге — четыре видео подряд, и это самое дорогое место страницы.
 *
 * Проверяем то, что легко сломать незаметно: до наведения не должно быть
 * ни одного <video> (иначе четыре HLS-потока начнут качаться сами по себе
 * и утянут LCP), а у медиаконтейнера должно быть заданное соотношение сторон,
 * иначе появление видео двигает вёрстку и портит CLS.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { DEFAULT_COMMERCIAL_LANDING } from '@/lib/commercial-landing/content'
import { CommercialCases, type CommercialCase } from '../commercial-cases'

/** framer-motion и наблюдатель видимости опираются на IntersectionObserver */
class IntersectionObserverStub {
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    // Считаем, что блок сразу оказался у вьюпорта — так проверяем,
    // что одной только видимости для загрузки потока недостаточно
    this.callback(
      [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }

  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const cases: CommercialCase[] = [
  {
    slug: 'wellery',
    title: 'Шесть утра',
    client: 'WELLERY',
    year: '2025',
    playbackId: 'db5ba48a-7dee-4357-931d-cd13e81b787d',
    posterUrl: 'https://cdn.example/wellery.webp',
    kind: 'HoReCa / рекламный ролик',
    meta: 'Digital · выставки · AI + live action',
  },
  {
    slug: 'mavin',
    title: 'Small Joys',
    client: 'MAVIN',
    year: '2025',
    playbackId: '467e6ac0-e51c-493a-b03c-139185b02c17',
    posterUrl: 'https://cdn.example/mavin.webp',
    kind: 'Fashion / brand campaign',
    meta: 'Москва · commercial',
  },
]

function renderCases(onCaseOpen = vi.fn()) {
  const result = render(
    <CommercialCases
      content={DEFAULT_COMMERCIAL_LANDING.cases}
      cases={cases}
      onCaseOpen={onCaseOpen}
      onVideoMilestone={vi.fn()}
    />
  )
  return { ...result, onCaseOpen }
}

describe('Блок коммерческих кейсов', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  })

  it('до наведения показывает только постеры, без потоков', () => {
    const { container } = renderCases()

    expect(container.querySelectorAll('video')).toHaveLength(0)
    expect(container.querySelectorAll('img')).toHaveLength(cases.length)
  })

  it('наведение на карточку поднимает видео только у неё', () => {
    const { container } = renderCases()

    fireEvent.mouseEnter(screen.getByRole('link', { name: /WELLERY/ }))

    expect(container.querySelectorAll('video')).toHaveLength(1)
  })

  it('медиаконтейнер имеет фиксированное соотношение сторон — без сдвига вёрстки', () => {
    const { container } = renderCases()

    const media = container.querySelectorAll<HTMLElement>('[style*="aspect-ratio"]')
    expect(media).toHaveLength(cases.length)
    media.forEach(node => expect(node.style.aspectRatio).toBe('16 / 9'))
  })

  it('карточка ведёт на страницу кейса и размечена аналитикой', () => {
    const { onCaseOpen } = renderCases()

    const link = screen.getByRole('link', { name: /MAVIN/ })
    expect(link).toHaveAttribute('href', '/projects/mavin')

    fireEvent.click(link)
    expect(onCaseOpen).toHaveBeenCalledWith('mavin')
  })

  it('показывает бизнес-контекст, а не только название работы', () => {
    renderCases()

    expect(screen.getByText('HoReCa / рекламный ролик')).toBeInTheDocument()
    expect(screen.getByText('Digital · выставки · AI + live action')).toBeInTheDocument()
  })
})
