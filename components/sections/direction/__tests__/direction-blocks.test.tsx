import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DirectionPageContext, type DirectionPageApi } from '../direction-context'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { OtherDirections } from '../other-directions'

const api: DirectionPageApi = {
  id: 'fashion',
  openBrief: () => undefined,
  openCase: () => undefined,
}

function render(node: React.ReactElement) {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(
    <DirectionPageContext.Provider value={api}>{node}</DirectionPageContext.Provider>
  )
  return host
}

describe('DirectionEnd', () => {
  it('читается фразой: между строками заголовка один пробел, пробелы на концах обрезаются', () => {
    const host = render(
      <DirectionEnd
        lines={['Какая ', 'коллекция ', 'следующая?']}
        ctaLabel="Обсудить съёмку коллекции"
      />
    )
    const title = host.querySelector('#direction-end-title')
    expect(title?.textContent).toBe('Какая коллекция следующая?')
  })

  it('работает и без пробелов в конце строк', () => {
    const host = render(
      <DirectionEnd lines={['С чего', 'начнётся', 'ваш фильм?']} ctaLabel="Рассказать о компании" />
    )
    expect(host.querySelector('#direction-end-title')?.textContent).toBe(
      'С\u00A0чего начнётся ваш\u00A0фильм?'
    )
  })

  it('подпись кнопки не оставляет предлог в конце строки', () => {
    const host = render(<DirectionEnd lines={['Вопрос?']} ctaLabel="Рассказать о компании" />)
    expect(host.querySelector('#direction-end .dir-btn')?.textContent).toBe(
      'Рассказать о\u00A0компании'
    )
  })

  it('слот aside — декор: скрыт от скринридера', () => {
    const host = render(
      <DirectionEnd lines={['Вопрос?']} ctaLabel="Обсудить" aside={<i data-sign="" />} />
    )
    expect(host.querySelector('[data-sign]')?.closest('[aria-hidden="true"]')).not.toBeNull()
  })
})

describe('DirectionFaq', () => {
  const items = [
    { question: 'Чем это отличается?', answer: 'Всем.' },
    { question: 'Сколько стоит?', answer: 'По брифу.' },
  ]

  it('номер вопроса отделён от текста пробелом и скрыт от скринридера', () => {
    const host = render(<DirectionFaq title="Вопросы" items={items} index="05" />)
    const heading = host.querySelector('h3')
    expect(heading?.textContent).toBe('01 Чем\u00A0это\u00A0отличается?')
    expect(heading?.querySelector('.dir-kit-faq-idx')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('слот aside попадает в левую колонку', () => {
    const host = render(<DirectionFaq title="Вопросы" items={items} aside={<i data-sign="" />} />)
    expect(host.querySelector('[data-sign]')).not.toBeNull()
  })
})

describe('OtherDirections', () => {
  it('нумерация сквозная, текущее направление — неактивная плитка «Вы здесь»', () => {
    const host = render(<OtherDirections current="fashion" />)
    const tiles = host.querySelectorAll('ul > li:not([aria-hidden])')
    expect(tiles).toHaveLength(7)
    const here = host.querySelector('[aria-current="page"]')
    expect(here?.textContent).toContain('Вы здесь')
    expect(here?.closest('a')).toBeNull()
    const numbers = Array.from(tiles).map(tile => tile.textContent?.slice(0, 2))
    expect(numbers).toEqual(['01', '02', '03', '04', '05', '06', '07'])
  })
})
