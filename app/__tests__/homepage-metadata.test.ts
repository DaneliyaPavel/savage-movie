/**
 * Стереж OpenGraph главной и честного lastModified в sitemap.
 *
 * История: app/(marketing)/page.tsx переопределял openGraph, указав только
 * title и description. В Next.js этот объект заменяется целиком, а не сливается
 * по полям, поэтому из корневого layout выпадали images, url, type, locale и
 * siteName — живой HTML главной отдавал ровно два og-тега, и ссылка уходила в
 * Telegram и VK без превью, хотя все подстраницы превью имели.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const APP_DIR = path.resolve(__dirname, '..')
const homepage = readFileSync(path.join(APP_DIR, '(marketing)', 'page.tsx'), 'utf-8')
const rootLayout = readFileSync(path.join(APP_DIR, 'layout.tsx'), 'utf-8')
const sitemap = readFileSync(path.join(APP_DIR, 'sitemap.ts'), 'utf-8')

/** Тело `export const metadata` без комментариев вокруг. */
function homepageMetadataBlock(): string {
  const start = homepage.indexOf('export const metadata')
  expect(start).toBeGreaterThan(-1)
  return homepage.slice(start, homepage.indexOf('\n}', start))
}

describe('OpenGraph главной', () => {
  it('корневой layout по-прежнему задаёт полный набор og', () => {
    const og = rootLayout.slice(rootLayout.indexOf('openGraph: {'))
    for (const field of ['type:', 'locale:', 'siteName:', 'images:']) {
      expect(og).toContain(field)
    }
  })

  it('главная не переопределяет openGraph частично', () => {
    const block = homepageMetadataBlock()

    // Либо не переопределяет вовсе (наследует полный набор), либо
    // переопределяет с изображением — частичный override снова терял бы превью.
    if (block.includes('openGraph')) {
      expect(block).toContain('images')
      expect(block).toContain('type')
      expect(block).toContain('locale')
      expect(block).toContain('siteName')
    } else {
      expect(block).not.toContain('openGraph')
    }
  })

  it('главная сохраняет собственный canonical', () => {
    expect(homepageMetadataBlock()).toMatch(/canonical:\s*'\/'/)
  })
})

describe('sitemap не выдумывает даты изменения', () => {
  it('у статических страниц нет lastModified: new Date()', () => {
    const staticBlock = sitemap.slice(
      sitemap.indexOf('const staticPages'),
      sitemap.indexOf('const projectPages')
    )
    expect(staticBlock).not.toContain('lastModified: new Date()')
  })

  it('у динамических страниц дата берётся из updated_at', () => {
    for (const entity of ['project', 'course', 'post']) {
      expect(sitemap).toContain(`lastModified: new Date(${entity}.updated_at)`)
    }
  })
})
