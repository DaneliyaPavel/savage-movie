import { describe, expect, it } from 'vitest'
import { buildAiCourseMail, makeLeadId, parseAiCourseLead } from '../ai-course'

const okBody = {
  source: 'ai-course',
  lead: {
    tier: 'advanced',
    channel: 'telegram',
    button: 'tier-advanced',
    utm: { utm_source: 'instagram', utm_campaign: 'oct' },
    referrer: 'instagram.com',
    page: 'https://ai.savagemovie.ru/',
    consent: { personalData: true, announcements: true, rev: '2026-10-01' },
  },
}

function parseOk(body: Record<string, unknown>) {
  const parsed = parseAiCourseLead(body)
  if (parsed.kind !== 'ok') throw new Error(`ожидали ok, получили ${parsed.kind}`)
  return parsed.lead
}

const receivedAt = new Date('2026-10-01T14:50:54.000Z') // 17:50:54 по Москве
const fixedRandom = () => 0.5

describe('parseAiCourseLead', () => {
  it('не трогает обычные заявки без source', () => {
    expect(parseAiCourseLead({ name: 'Иван', phone: '+79990000000' })).toEqual({ kind: 'none' })
    expect(parseAiCourseLead({ source: 'other', lead: okBody.lead })).toEqual({ kind: 'none' })
  })

  it('не принимает предзапись без согласия на обработку данных', () => {
    for (const lead of [undefined, {}, { consent: {} }, { consent: { personalData: 'yes' } }]) {
      expect(parseAiCourseLead({ source: 'ai-course', lead })).toMatchObject({ kind: 'invalid' })
    }
  })

  it('разбирает корректную заявку', () => {
    expect(parseOk(okBody)).toEqual({
      tier: 'advanced',
      channel: 'telegram',
      announcements: true,
      consentRev: '2026-10-01',
      button: 'tier-advanced',
      utm: ['utm_source=instagram', 'utm_campaign=oct'],
      referrer: 'instagram.com',
      page: 'https://ai.savagemovie.ru/',
    })
  })

  it('подставляет безопасные значения вместо мусора', () => {
    const lead = parseOk({
      source: 'ai-course',
      lead: {
        tier: 'platinum',
        channel: 'fax',
        button: '<script>',
        utm: { utm_source: 'a\nСогласие: да', not_utm: 'x', 'utm_<b>': 'y' },
        referrer: 'evil.com/<x>',
        page: 'javascript:alert(1)',
        consent: { personalData: true, rev: '<b>' },
      },
    })
    expect(lead.tier).toBe('undecided')
    expect(lead.channel).toBeNull()
    expect(lead.button).toBe('unknown')
    expect(lead.utm).toEqual(['utm_source=a Согласие: да'])
    expect(lead.referrer).toBe('')
    expect(lead.page).toBe('')
    expect(lead.consentRev).toBe('')
    expect(lead.announcements).toBe(false)
  })

  it('ограничивает число меток', () => {
    const utm = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`utm_k${i}`, `v${i}`]))
    expect(parseOk({ source: 'ai-course', lead: { consent: { personalData: true }, utm } }).utm).toHaveLength(6)
  })
})

describe('makeLeadId', () => {
  it('собирает номер по московскому времени', () => {
    expect(makeLeadId(receivedAt, fixedRandom)).toBe('AI-261001-1750-I000')
  })

  it('учитывает переход суток по Москве', () => {
    // 21:30 UTC 30 сентября = 00:30 МСК 1 октября
    const id = makeLeadId(new Date('2026-09-30T21:30:00.000Z'), fixedRandom)
    expect(id.startsWith('AI-261001-0030-')).toBe(true)
  })

  it('имеет единый формат', () => {
    expect(makeLeadId(receivedAt)).toMatch(/^AI-\d{6}-\d{4}-[0-9A-Z]{4}$/)
  })
})

describe('buildAiCourseMail', () => {
  const contact = { name: 'Анна Тестова', email: null, phone: null, telegram: '@anna_test' }

  it('формирует тему с фиксированным префиксом для фильтров почты', () => {
    const mail = buildAiCourseMail(parseOk(okBody), contact, receivedAt, fixedRandom)
    expect(mail.subject).toBe('[AI-курс] Предзапись — Анна Тестова · Продвинутый')
    expect(mail.leadId).toBe('AI-261001-1750-I000')
  })

  it('кладёт в письмо всё, что нужно менеджеру и CRM', () => {
    const mail = buildAiCourseMail(parseOk(okBody), contact, receivedAt, fixedRandom)
    for (const part of [
      'Анна Тестова',
      'https://t.me/anna_test',
      'Продвинутый (6 занятий)',
      'Карточка тарифа «Продвинутый»',
      'utm_source=instagram, utm_campaign=oct',
      'instagram.com',
      'Да, 01.10.2026, 17:50:54 (МСК) · редакция 2026-10-01',
      'AI-261001-1750-I000',
      'Для CRM',
    ]) {
      expect(mail.html, part).toContain(part)
    }
    expect(mail.text).toContain('Тариф: Продвинутый (6 занятий)')
    expect(mail.text).toContain('Telegram: @anna_test · удобнее всего')
    expect(mail.text).toContain('Согласие на анонсы: Да, можно присылать анонсы и новости')
    expect(mail.text).toContain('ID заявки: AI-261001-1750-I000')
  })

  it('делает кнопки связи по каждому указанному контакту', () => {
    const lead = parseOk({ ...okBody, lead: { ...okBody.lead, channel: 'phone' } })
    const mail = buildAiCourseMail(
      lead,
      { name: 'Борис', email: 'boris@mail.ru', phone: '+7 921 402-18-39', telegram: null },
      receivedAt,
      fixedRandom
    )
    expect(mail.html).toContain('href="tel:+79214021839"')
    expect(mail.html).toContain('href="mailto:boris@mail.ru?subject=')
    expect(mail.html).not.toContain('t.me/')
  })

  it('экранирует всё, что ввёл пользователь', () => {
    const lead = parseOk({
      source: 'ai-course',
      lead: {
        consent: { personalData: true },
        utm: { utm_source: '"><script>alert(1)</script>' },
        referrer: 'a.com',
      },
    })
    const mail = buildAiCourseMail(
      lead,
      { name: '<img src=x onerror=alert(1)>', email: null, phone: null, telegram: '@anna_test' },
      receivedAt,
      fixedRandom
    )
    expect(mail.html).not.toContain('<img src=x')
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('не делает ссылку mailto: из адреса с параметрами', () => {
    const lead = parseOk(okBody)
    const mail = buildAiCourseMail(
      lead,
      { name: 'Хакер', email: 'a@b.ru?bcc=evil@x.ru', phone: null, telegram: null },
      receivedAt,
      fixedRandom
    )
    expect(mail.html).not.toContain('mailto:')
    expect(mail.html).toContain('a@b.ru?bcc=evil@x.ru') // виден как текст, но не как ссылка
  })

  it('не вставляет перевод строки в тему', () => {
    const mail = buildAiCourseMail(
      parseOk(okBody),
      { ...contact, name: 'Имя\r\nBcc: evil@x.ru' },
      receivedAt,
      fixedRandom
    )
    expect(mail.subject).not.toMatch(/[\r\n]/)
  })

  it('пишет «тариф не выбран», если тариф не указан', () => {
    const lead = parseOk({ source: 'ai-course', lead: { consent: { personalData: true } } })
    const mail = buildAiCourseMail(lead, contact, receivedAt, fixedRandom)
    expect(mail.subject).toBe('[AI-курс] Предзапись — Анна Тестова · тариф не выбран')
    expect(mail.text).toContain('Тариф: Пока не выбран')
  })
})
