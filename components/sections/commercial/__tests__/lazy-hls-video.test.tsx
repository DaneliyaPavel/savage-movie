/**
 * Фоновые лупы под hero (сцены /services, лендинг) не должны делить с ним канал:
 * на 4 Мбит/с одновременная загрузка лупа и MP4 hero отодвигала первое движение
 * hero с 5,3 до 7,3 с. Сам hero и карточки по наведению задержки не получают.
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { LazyHlsVideo } from '../lazy-hls-video'

const ID = 'db5ba48a-7dee-4357-931d-cd13e81b787d'

function surfaceOf(props: Partial<React.ComponentProps<typeof LazyHlsVideo>>) {
  const { container } = render(<LazyHlsVideo playbackId={ID} {...props} />)
  return container.querySelector('[data-sm]') as HTMLElement
}

describe('LazyHlsVideo: очередность относительно hero', () => {
  it('фоновый луп ждёт hero', () => {
    const surface = surfaceOf({ autoPlay: true, loop: true })
    expect(surface).toHaveAttribute('data-sm-after', 'hero')
  })

  it('сам hero не ждёт никого', () => {
    const surface = surfaceOf({ autoPlay: true, loop: true, eager: true, priority: true })
    expect(surface).not.toHaveAttribute('data-sm-after')
    expect(surface).toHaveAttribute('data-sm-hero')
  })

  it('карточка по наведению не получает задержки', () => {
    const surface = surfaceOf({})
    expect(surface).not.toHaveAttribute('data-sm-after')
    expect(surface).toHaveAttribute('data-sm-play', 'hover-only')
  })
})
