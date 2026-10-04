import { describe, expect, it } from 'vitest'
import { getSafeRedirect } from '@/lib/auth/safe-redirect'

const FALLBACK = '/admin'
const SITE = 'https://savagemovie.ru'

describe('getSafeRedirect', () => {
  describe('пропускает пути внутри сайта как есть', () => {
    it.each([
      '/admin',
      '/admin/projects',
      '/admin/projects?x=1#y',
      '/dashboard/courses/abc',
      '/',
      '/login?redirect=/admin',
      '/%09/evil.example', // %09 не раскодируется браузером до разбора пути
      '/.//evil.example', // путь "//evil.example" на нашем же хосте, не схема-относительный
      '/a@evil.example',
      '/path/with%20space',
      '/кириллица',
    ])('%s', raw => {
      expect(getSafeRedirect(raw, FALLBACK)).toBe(raw)
    })
  })

  describe('отдаёт fallback для обходов проверки', () => {
    it.each([
      // табуляция и переводы строк: браузер вырежет их до разбора
      '/\t/evil.example',
      '/\n/evil.example',
      '/\r/evil.example',
      '/\t\t/evil.example',
      '/\t/\t/evil.example',
      '/\r\n/evil.example',
      '\t//evil.example',
      '/\t\\evil.example',
      // то, что searchParams.get раскодирует из ?redirect=/%09/evil.example
      decodeURIComponent('/%09/evil.example'),
      decodeURIComponent('/%0a/evil.example'),
      decodeURIComponent('/%0d/evil.example'),
      // схема-относительные и абсолютные адреса
      '//evil.example',
      '//evil.example/admin',
      '///evil.example',
      '/\\evil.example',
      '/\\/evil.example',
      '\\\\evil.example',
      '\\/evil.example',
      'https://evil.example',
      'http://evil.example',
      'https://savagemovie.ru/admin',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'evil.example',
      'admin',
      '',
      // другие управляющие и пробельные символы
      '/\u0000/evil.example',
      '/\u000b/evil.example',
      '/\u000c/evil.example',
      '/\u001f/evil.example',
      '/\u007f/evil.example',
      '/\u0085/evil.example',
      '/ /evil.example',
      '/ /evil.example',
      '/ /evil.example',
      '/﻿/evil.example',
      ' /admin',
      '/admin ',
      '/ /evil.example',
      '/admin\t',
    ])('%j', raw => {
      expect(getSafeRedirect(raw, FALLBACK)).toBe(FALLBACK)
    })

    it.each([null, undefined])('%s', raw => {
      expect(getSafeRedirect(raw, FALLBACK)).toBe(FALLBACK)
    })
  })

  it('прежняя проверка пропускала табуляцию и вела на чужой хост, новая нет', () => {
    // Проверка из login/page.tsx до исправления
    const legacyAccepts = (raw: string) =>
      raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\')

    for (const raw of ['/\t/evil.example', '/\n/evil.example', '/\r/evil.example']) {
      expect(legacyAccepts(raw)).toBe(true)
      expect(new URL(raw, SITE).origin).toBe('https://evil.example')
      expect(getSafeRedirect(raw, FALLBACK)).toBe(FALLBACK)
    }
  })

  it('использует переданный fallback', () => {
    expect(getSafeRedirect('//evil.example', '/dashboard')).toBe('/dashboard')
    expect(getSafeRedirect(null, '/')).toBe('/')
  })

  it('никогда не уводит с сайта: перебор управляющих символов в любой позиции', () => {
    // Браузерный разбор тот же, что у new URL: проверяем реальным парсером результата
    const controls = Array.from({ length: 0x21 }, (_, code) => String.fromCharCode(code))
    controls.push('\u007f', '\u0085', ' ', ' ', ' ', '\\')

    const candidates: string[] = []
    for (const ch of controls) {
      candidates.push(
        `/${ch}/evil.example`,
        `/${ch}${ch}/evil.example`,
        `/${ch}\\evil.example`,
        `${ch}//evil.example`,
        `/${ch}`,
        `/a${ch}//evil.example`
      )
    }

    for (const raw of candidates) {
      const result = getSafeRedirect(raw, FALLBACK)
      expect(new URL(result, SITE).origin, JSON.stringify(raw)).toBe(SITE)
      // Безопасным может быть только результат без символов, которые браузер вырезает
      if (result !== FALLBACK) expect(result).toBe(raw)
    }
  })
})
