/**
 * Стереж Organization JSON-LD.
 *
 * История: узел был размечен типом VideoProductionCompany, которого нет в
 * словаре schema.org, а sameAs и реквизиты отсутствовали. Теперь это
 * Organization с подтверждёнными данными, и здесь проверяется, что она не
 * съедет обратно и не обзаведётся выдуманным адресом.
 *
 * Тест читает исходник: app/layout.tsx импортирует next/font/local и
 * globals.css, поэтому импортировать модуль в jsdom дороже, чем разобрать текст.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const layout = readFileSync(path.resolve(__dirname, '..', 'layout.tsx'), 'utf-8')
const org = layout.slice(
  layout.indexOf('const organizationJsonLd'),
  layout.indexOf('const websiteJsonLd')
)

/** Без комментариев: утверждения должны проверять код, а не пояснения к нему. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

const orgCode = stripComments(org)
const layoutCode = stripComments(layout)

describe('тип и связи графа', () => {
  it('@type — Organization', () => {
    expect(org).toMatch(/'@type':\s*'Organization'/)
  })

  it('не возвращается к несуществующим и deprecated типам', () => {
    // VideoProductionCompany нет в словаре, ProfessionalService помечен deprecated.
    expect(layoutCode).not.toContain('VideoProductionCompany')
    expect(layoutCode).not.toContain('ProfessionalService')
  })

  it('WebSite.publisher ссылается на тот же @id', () => {
    expect(layout).toContain("publisher: { '@id': `${baseUrl}/#organization` }")
    expect(layout).toContain("'@id': `${baseUrl}/#organization`")
  })
})

describe('подтверждённые реквизиты', () => {
  it.each([
    ['legalName', 'ИП Плешивцева Мария Михайловна'],
    ['taxID', '780526847456'],
    ['ОГРНИП', '321784700027149'],
  ])('%s присутствует', (_field, value) => {
    expect(org).toContain(value)
  })

  it('ОГРНИП отдан через PropertyValue, а не впихнут в taxID', () => {
    expect(org).toMatch(/identifier:\s*\{[\s\S]*?'@type':\s*'PropertyValue'/)
    expect(org).not.toMatch(/taxID:\s*'321784700027149'/)
  })

  it('телефон и почта берутся из общего источника, а не хардкодятся', () => {
    expect(org).toContain('telephone: PHONE_DISPLAY')
    expect(org).toContain('email: EMAIL')
  })
})

describe('адрес не выдумывается', () => {
  it('в разметке нет PostalAddress', () => {
    // Публичного офиса нет; адрес регистрации ИП — не адрес бизнеса.
    expect(orgCode).not.toContain('PostalAddress')
    expect(orgCode).not.toContain('streetAddress')
    expect(orgCode).not.toMatch(/^\s*address:/m)
  })

  it('география выражена через areaServed', () => {
    for (const area of ['Санкт-Петербург', 'Ленинградская область', 'Москва', 'Россия']) {
      expect(org).toContain(area)
    }
  })
})

describe('часы работы размечены валидно', () => {
  it('не используются свойства, невалидные для Organization', () => {
    // openingHours -> CivicStructure/LocalBusiness; openingHoursSpecification -> Place.
    expect(orgCode).not.toMatch(/^\s*openingHours:/m)
    expect(orgCode).not.toMatch(/^\s*openingHoursSpecification:/m)
  })

  it('часы идут через contactPoint.hoursAvailable', () => {
    expect(org).toMatch(/contactPoint:\s*\{[\s\S]*?'@type':\s*'ContactPoint'/)
    expect(org).toMatch(/hoursAvailable:\s*\{[\s\S]*?'@type':\s*'OpeningHoursSpecification'/)
    expect(org).toContain("opens: '08:00'")
    expect(org).toContain("closes: '22:00'")
  })
})

describe('sameAs', () => {
  it.each([
    'https://www.instagram.com/mari.seven/',
    'https://t.me/mariseven',
    'https://vk.ru/mari_seven',
    'https://www.youtube.com/@savage-movie',
  ])('содержит %s', url => {
    expect(org).toContain(url)
  })

  it('не содержит несуществующий YouTube без дефиса', () => {
    // youtube.com/@savagemovie отдаёт 404 — мёртвая ссылка ломает склейку сущности.
    expect(orgCode).not.toMatch(/youtube\.com\/@savagemovie(?![-\w])/)
  })
})
