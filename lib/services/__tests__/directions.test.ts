/**
 * Направления — конфигурация, от которой зависят ссылки в разметке, значения
 * в заявке и значения в целях Метрики. Ошибка здесь не падает в рантайме:
 * она тихо уводит человека на несуществующий маршрут или теряет разметку
 * заявки, поэтому проверяется отдельно.
 */
import { describe, expect, it } from 'vitest'

import {
  SERVICE_DIRECTIONS,
  SERVICE_DIRECTION_IDS,
  SERVICES_BRIEF_ANCHOR,
  SERVICES_PATH,
  directionHref,
  getServiceDirection,
} from '../directions'

describe('Конфигурация направлений', () => {
  it('идентификаторы уникальны: по ним сводится аналитика и CRM', () => {
    expect(new Set(SERVICE_DIRECTION_IDS).size).toBe(SERVICE_DIRECTIONS.length)
  })

  it('номера идут подряд от 01 — это порядок монтажа, а не произвольные ярлыки', () => {
    const indexes = SERVICE_DIRECTIONS.map(direction => direction.index)
    const expected = SERVICE_DIRECTIONS.map((_, position) => String(position + 1).padStart(2, '0'))
    expect(indexes).toEqual(expected)
  })

  it('у каждого направления есть доказательства и текст для разметки', () => {
    for (const direction of SERVICE_DIRECTIONS) {
      expect(direction.proofSlugs.length, direction.id).toBeGreaterThan(0)
      expect(direction.description.length, direction.id).toBeGreaterThan(0)
      expect(direction.ctaLabel.length, direction.id).toBeGreaterThan(0)
    }
  })

  it('ровно одно направление опубликовано — коммерческое', () => {
    const published = SERVICE_DIRECTIONS.filter(direction => direction.route.published)
    expect(published.map(direction => direction.id)).toEqual(['commercial'])
  })
})

describe('directionHref', () => {
  it('опубликованное направление ведёт на свою страницу', () => {
    const commercial = getServiceDirection('commercial')!
    expect(directionHref(commercial)).toBe('/reklamny-rolik')
  })

  /**
   * Главная защита спринта: пока страницы направления не существует, её путь
   * не должен попасть в разметку ни при каких условиях. Иначе поиск получает
   * набор 404, а человек — ссылку в никуда.
   */
  it('неопубликованное направление уводит в бриф, а не на будущий маршрут', () => {
    const pending = SERVICE_DIRECTIONS.filter(direction => !direction.route.published)
    expect(pending.length).toBeGreaterThan(0)

    for (const direction of pending) {
      const href = directionHref(direction)
      expect(href, direction.id).toBe(`${SERVICES_PATH}#${SERVICES_BRIEF_ANCHOR}`)
      expect(href, direction.id).not.toContain(direction.route.path)
    }
  })
})
