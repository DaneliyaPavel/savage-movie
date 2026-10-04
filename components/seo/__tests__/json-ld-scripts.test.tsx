// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { JsonLdScripts, escapeJsonLd } from '../json-ld-scripts'

const OPEN = '<script type="application/ld+json">'
const CLOSE = '</script>'

/** Достаёт содержимое всех JSON-LD тегов из разметки так, как это делает HTML-парсер */
function extractScripts(html: string): string[] {
  const result: string[] = []
  let rest = html
  while (rest.includes(OPEN)) {
    const start = rest.indexOf(OPEN) + OPEN.length
    // HTML-парсер закрывает script на первом "</script" (без учёта регистра)
    const end = rest.slice(start).search(/<\/script/i)
    expect(end).toBeGreaterThanOrEqual(0)
    result.push(rest.slice(start, start + end))
    rest = rest.slice(start + end + CLOSE.length)
  }
  return result
}

const ATTACK = '</script><script>alert(1)</script>'

describe('JsonLdScripts', () => {
  it('строка с </script> из данных не выходит из тега и сохраняется после JSON.parse', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: `Заголовок ${ATTACK}`,
      description: '<!-- комментарий --> <img src=x onerror=alert(1)>',
      keywords: ['a', ATTACK],
      author: { '@type': 'Person', name: '</SCRIPT >' },
    }

    const html = renderToStaticMarkup(<JsonLdScripts scripts={[JSON.stringify(data)]} />)

    // Ровно один тег: чужой <script> не появился
    expect(html.match(/<script/gi)).toHaveLength(1)
    expect(html.match(/<\/script/gi)).toHaveLength(1)
    expect(html.toLowerCase()).not.toContain('alert(1)</script><script>')

    const [emitted] = extractScripts(html)
    expect(JSON.parse(emitted)).toEqual(data)
  })

  it('U+2028 и U+2029 экранируются и тоже возвращаются при разборе', () => {
    const data = { name: 'a\u2028b\u2029c' }
    const html = renderToStaticMarkup(<JsonLdScripts scripts={[JSON.stringify(data)]} />)
    const [emitted] = extractScripts(html)

    expect(emitted).not.toMatch(/[\u2028\u2029]/)
    expect(JSON.parse(emitted)).toEqual(data)
  })

  it('безопасные данные не меняются: кириллица, кавычки, ссылки, вложенность', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Savage Movie',
      description: 'Продакшн «Savage Movie» — "ролики" & клипы',
      url: 'https://savagemovie.ru/?a=1&b=2',
      sameAs: ['https://t.me/example'],
      offers: { price: 1000, nested: [{ ok: true, none: null }] },
    }
    const json = JSON.stringify(data)

    expect(escapeJsonLd(json)).toBe(json)
    const [emitted] = extractScripts(renderToStaticMarkup(<JsonLdScripts scripts={[json]} />))
    expect(emitted).toBe(json)
    expect(JSON.parse(emitted)).toEqual(data)
  })

  it('несколько скриптов: каждый отдельным тегом', () => {
    const a = { n: 1, t: ATTACK }
    const b = { n: 2 }
    const html = renderToStaticMarkup(
      <JsonLdScripts scripts={[JSON.stringify(a), JSON.stringify(b)]} />
    )
    const emitted = extractScripts(html)

    expect(emitted).toHaveLength(2)
    expect(JSON.parse(emitted[0])).toEqual(a)
    expect(JSON.parse(emitted[1])).toEqual(b)
  })
})

describe('escapeJsonLd', () => {
  it('заменяет "<" на \\u003c', () => {
    expect(escapeJsonLd('{"a":"</script>"}')).toBe('{"a":"\\u003c/script>"}')
  })
})
