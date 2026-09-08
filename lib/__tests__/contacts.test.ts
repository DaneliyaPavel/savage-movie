/**
 * Телефон обязан присутствовать в вёрстке, а не только в разметке.
 *
 * История: `tel:+79214021839` лежал в двух файлах репозитория, и ни один из них
 * не был подключён к дереву компонентов — на живом сайте телефона не было
 * вообще, при том что мета-описание /contact обещало «Телефон, email, форма».
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { EMAIL, PHONE_DISPLAY, PHONE_E164, PHONE_HREF } from '../contacts'

const ROOT = path.resolve(__dirname, '..', '..')
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf-8')

/**
 * Исходник без строк import. Без этого проверка «файл содержит PHONE_HREF»
 * проходит на одном лишь импорте, даже если саму ссылку из вёрстки убрали, —
 * ровно эта дыра и обнаружилась при мутационной проверке.
 */
const body = (p: string) => read(p).replace(/^import [^\n]*$/gm, '')

/** Файлы, которые реально отрендерены на живом сайте. */
const LIVE_SURFACES: ReadonlyArray<[string, string]> = [
  ['главная (SiteFooter)', 'components/sections/site-footer.tsx'],
  ['/contact', 'app/(marketing)/contact/page.tsx'],
  ['/projects, /clients, кейсы', 'components/sections/ProjectsJalousieFooter.tsx'],
  ['/reklamny-rolik', 'app/(marketing)/reklamny-rolik/client.tsx'],
]

describe('константы контактов согласованы между собой', () => {
  it('href построен из отображаемого номера', () => {
    expect(PHONE_HREF).toBe(`tel:${PHONE_E164}`)
    expect(PHONE_DISPLAY.replace(/[^\d+]/g, '')).toBe(PHONE_E164)
  })

  it('почта та же, что принимает заявки', () => {
    expect(EMAIL).toBe('hello@savagemovie.ru')
  })
})

describe('телефон присутствует на живых поверхностях', () => {
  it.each(LIVE_SURFACES)('%s отдаёт кликабельный телефон', (_label, file) => {
    expect(read(file)).toContain('@/lib/contacts')
    // Именно в разметке, а не только в импорте.
    expect(body(file)).toMatch(/href=\{PHONE_HREF\}/)
    expect(body(file)).toMatch(/\{PHONE_DISPLAY\}/)
  })

  it.each(LIVE_SURFACES)('%s показывает и почту рядом с телефоном', (_label, file) => {
    expect(body(file)).toMatch(/href=\{EMAIL_HREF\}/)
  })

  it.each(LIVE_SURFACES)('%s не хардкодит номер мимо общего источника', (_label, file) => {
    expect(read(file)).not.toMatch(/tel:\+?\d/)
  })
})
