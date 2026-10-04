import { describe, expect, it } from 'vitest'

import { normalizeBriefUrl } from '../safe-url'

describe('normalizeBriefUrl', () => {
  it.each([
    ['Яндекс.Диск', 'https://disk.yandex.ru/d/AbCdEf123'],
    ['Яндекс.Диск, папка с кириллицей', 'https://disk.yandex.ru/client/disk/Бриф'],
    ['Google Drive', 'https://drive.google.com/drive/folders/1AbC_dEf?usp=sharing'],
    ['Dropbox', 'https://www.dropbox.com/scl/fo/xyz123/h?rlkey=abc&dl=0'],
    ['WeTransfer', 'https://we.tl/t-AbCdEf1234'],
    ['Notion', 'https://www.notion.so/studio/Brief-0123456789abcdef'],
    ['собственный адрес загрузки', 'https://savagemovie.ru/uploads/briefs/0b1c2d3e.pdf'],
  ])('пропускает обычную ссылку: %s', (_label, url) => {
    const result = normalizeBriefUrl(url)
    expect(result).not.toBe('')
    expect(new URL(result).host).toBe(new URL(url).host)
  })

  it('обычный http не отбрасывается: корпоративные серверы бывают без TLS', () => {
    expect(normalizeBriefUrl('http://files.example.com/brief.pdf')).toBe(
      'http://files.example.com/brief.pdf'
    )
  })

  it('отклоняет подмену домена через логин: https://наш-домен@чужой-хост/', () => {
    expect(normalizeBriefUrl('https://savagemovie.ru@evil.example/brief.pdf')).toBe('')
    expect(normalizeBriefUrl('http://savagemovie.ru@evil.example/')).toBe('')
  })

  it('отклоняет любой логин и пароль, даже без подмены', () => {
    expect(normalizeBriefUrl('https://savagemovie.ru:secret@evil.example/')).toBe('')
    expect(normalizeBriefUrl('https://user:pass@files.example.com/brief')).toBe('')
    expect(normalizeBriefUrl('https://user@files.example.com/brief')).toBe('')
    expect(normalizeBriefUrl('https://:pass@files.example.com/brief')).toBe('')
  })

  it('пустое имя пользователя без пароля не считается логином', () => {
    expect(normalizeBriefUrl('https://@disk.yandex.ru/d/abc')).toBe('https://disk.yandex.ru/d/abc')
  })

  it('схема после @ в пути или запросе не путает проверку', () => {
    const url = 'https://disk.yandex.ru/d/abc?next=https://savagemovie.ru@evil.example/'
    expect(normalizeBriefUrl(url)).toBe(url)
  })

  it('обратный слеш не превращает наш домен в логин: хост остаётся тем, что слева', () => {
    // WHATWG трактует «\» как «/», значит хост здесь savagemovie.ru, а не evil.example
    const result = normalizeBriefUrl('https://savagemovie.ru\\@evil.example/')
    expect(result === '' || new URL(result).hostname === 'savagemovie.ru').toBe(true)
  })

  it('IDN показывается в punycode, подмена похожими буквами видна в самом хосте', () => {
    const result = normalizeBriefUrl('https://sаvagemovie.ru/brief')
    expect(new URL(result).hostname).toMatch(/^xn--/)
  })

  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['file:', 'file:///etc/passwd'],
    ['ftp:', 'ftp://files.example.com/brief'],
    ['относительная ссылка', '/uploads/briefs/a.pdf'],
    ['текст без схемы', 'disk.yandex.ru/d/abc'],
    ['пустая строка', ''],
  ])('отклоняет: %s', (_label, url) => {
    expect(normalizeBriefUrl(url)).toBe('')
  })
})
