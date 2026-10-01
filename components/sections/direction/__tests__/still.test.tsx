import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { COVER_SIZES, PORTRAIT_QUERY, Still } from '../still'

function render(node: React.ReactElement) {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(node)
  return host
}

describe('Still: вертикальный кадр для высокого слота', () => {
  it('без portrait рисует один <img> и не заводит <picture>', () => {
    const host = render(<Still src="/scenes/a.webp" alt="" />)
    expect(host.querySelector('picture')).toBeNull()
    expect(host.querySelectorAll('img')).toHaveLength(1)
  })

  it('с portrait кладёт вертикальный кадр в <source> под запрос высокого экрана', () => {
    const host = render(
      <Still
        src="/scenes/wide.webp"
        alt=""
        sizes="100vw"
        objectPosition="40% 30%"
        portrait={{ src: '/scenes/tall.webp', objectPosition: '55% 20%' }}
      />
    )
    const source = host.querySelector('picture > source')
    expect(source?.getAttribute('media')).toBe(PORTRAIT_QUERY)
    // оба файла идут через оптимизатор, и браузер берёт только один из них
    expect(decodeURIComponent(source?.getAttribute('srcset') ?? '')).toContain('/scenes/tall.webp')
    const img = host.querySelector('picture > img')
    expect(decodeURIComponent(img?.getAttribute('srcset') ?? '')).toContain('/scenes/wide.webp')
    // точка кропа переключается той же медиа-проверкой, что и файл
    const style = img?.getAttribute('style') ?? ''
    expect(style).toContain('--still-pos:40% 30%')
    expect(style).toContain('--still-pos-portrait:55% 20%')
  })

  it('если файл вне оптимизатора, portrait не ломает кадр: остаётся один <img>', () => {
    const host = render(
      <Still src="https://example.com/a.jpg" alt="" portrait={{ src: '/scenes/tall.webp' }} />
    )
    expect(host.querySelector('picture')).toBeNull()
    expect(host.querySelectorAll('img')).toHaveLength(1)
  })

  it('COVER_SIZES просит ширину с запасом только для высокого экрана', () => {
    expect(COVER_SIZES).toBe(`${PORTRAIT_QUERY} 360vw, 100vw`)
  })
})
