/**
 * Атрибуция должна пережить путь «объявление → лендинг → кейс → форма».
 *
 * Если метки читать из адресной строки в момент отправки, заявка с четвёртой
 * страницы придёт без источника, и Директ не сведёт расход с обращением.
 * Поэтому проверяем именно устойчивость к переходам по чистым URL.
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { buildAttributionFields, captureAttribution, getAttribution } from '../attribution'

function visit(search: string, referrer = ''): void {
  window.history.replaceState({}, '', `/reklamny-rolik${search}`)
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true })
}

describe('атрибуция рекламного трафика', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    visit('')
  })

  it('снимает метки Директа с адресной строки', () => {
    visit('?utm_source=yandex&utm_medium=cpc&utm_campaign=rolik&yclid=123', 'https://yandex.ru/')

    const { last } = captureAttribution()

    expect(last).toMatchObject({
      utm_source: 'yandex',
      utm_medium: 'cpc',
      utm_campaign: 'rolik',
      yclid: '123',
      referrer: 'https://yandex.ru/',
    })
  })

  it('сохраняет источник при переходе на страницу без меток', () => {
    visit('?utm_source=yandex&yclid=123')
    captureAttribution()

    // Пользователь ушёл на кейс и вернулся — URL уже чистый
    visit('')
    captureAttribution()

    expect(buildAttributionFields()).toMatchObject({ utm_source: 'yandex', yclid: '123' })
  })

  it('первый источник не затирается вторым визитом', () => {
    visit('?utm_source=yandex&utm_campaign=first')
    captureAttribution()

    visit('?utm_source=telegram&utm_campaign=second')
    captureAttribution()

    const fields = buildAttributionFields()
    // В заявку идёт последний клик — по нему сводится расход
    expect(fields.utm_source).toBe('telegram')
    expect(fields.utm_campaign).toBe('second')
    // Первый источник сохраняется отдельно
    expect(fields.first_utm_source).toBe('yandex')
    expect(fields.first_utm_campaign).toBe('first')
  })

  it('органический заход не создаёт пустую атрибуцию', () => {
    visit('')
    captureAttribution()

    expect(getAttribution()).toEqual({ first: null, last: null })
    expect(buildAttributionFields()).toMatchObject({ utm_source: null, yclid: null })
  })

  it('gclid тоже считается рекламным кликом', () => {
    visit('?gclid=abc')
    captureAttribution()

    expect(buildAttributionFields().gclid).toBe('abc')
  })

  it('переживает недоступное хранилище, а не роняет страницу', () => {
    const original = window.localStorage.getItem
    // Приватный режим Safari: чтение бросает исключение
    window.localStorage.getItem = () => {
      throw new Error('storage disabled')
    }

    visit('?utm_source=yandex')
    expect(() => captureAttribution()).not.toThrow()

    window.localStorage.getItem = original
  })
})
