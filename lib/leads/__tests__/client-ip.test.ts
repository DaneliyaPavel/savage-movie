import { describe, expect, it } from 'vitest'

import { getClientIp, UNKNOWN_CLIENT_IP } from '../client-ip'

function headersOf(values: Record<string, string>): Headers {
  return new Headers(values)
}

describe('getClientIp', () => {
  it('берёт X-Real-IP, который выставляет nginx', () => {
    expect(getClientIp(headersOf({ 'x-real-ip': '203.0.113.7' }))).toBe('203.0.113.7')
  })

  it('X-Real-IP важнее X-Forwarded-For: подделанная цепочка ничего не меняет', () => {
    const headers = headersOf({
      'x-real-ip': '203.0.113.7',
      'x-forwarded-for': '1.1.1.1, 2.2.2.2, 203.0.113.7',
    })
    expect(getClientIp(headers)).toBe('203.0.113.7')
  })

  it('без X-Real-IP берёт ПОСЛЕДНИЙ элемент X-Forwarded-For, а не первый', () => {
    // Первые элементы прислал клиент, последний дописал nginx
    const headers = headersOf({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7, 203.0.113.7' })
    expect(getClientIp(headers)).toBe('203.0.113.7')
  })

  it('одиночный X-Forwarded-For работает как раньше', () => {
    expect(getClientIp(headersOf({ 'x-forwarded-for': '10.0.0.1' }))).toBe('10.0.0.1')
  })

  it('разный подставленный префикс не даёт новый адрес', () => {
    const first = getClientIp(headersOf({ 'x-forwarded-for': 'spoof-a, 198.51.100.4' }))
    const second = getClientIp(headersOf({ 'x-forwarded-for': '9.9.9.9, 198.51.100.4' }))
    expect(first).toBe('198.51.100.4')
    expect(second).toBe(first)
  })

  it('мусор в последнем элементе не заставляет доверять клиентским элементам левее', () => {
    const headers = headersOf({ 'x-forwarded-for': '6.6.6.6, not-an-ip' })
    expect(getClientIp(headers)).toBe(UNKNOWN_CLIENT_IP)
  })

  it('невалидный X-Real-IP игнорируется и не становится ключом лимитера', () => {
    const headers = headersOf({
      'x-real-ip': 'a'.repeat(4000),
      'x-forwarded-for': '203.0.113.7',
    })
    expect(getClientIp(headers)).toBe('203.0.113.7')
    expect(getClientIp(headersOf({ 'x-real-ip': '<script>' }))).toBe(UNKNOWN_CLIENT_IP)
  })

  it('понимает IPv6 и приводит его к нижнему регистру', () => {
    expect(getClientIp(headersOf({ 'x-real-ip': '2001:DB8::1' }))).toBe('2001:db8::1')
  })

  it('без заголовков возвращает unknown', () => {
    expect(getClientIp(headersOf({}))).toBe(UNKNOWN_CLIENT_IP)
  })
})
