/**
 * Библиотека кадров сцен: файлы лежат в public/, у каждого направления есть
 * кадры, а безымянный кадр сцены не превращается в подпись чужой работы.
 */
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { SERVICE_DIRECTIONS } from '../directions'
import { isCredited } from '../pages/resolve'
import { DIRECTION_SCENES, SCENE_STILLS, sceneFrame, sceneFramesFor } from '../scene-stills'

const PUBLIC = path.resolve(__dirname, '../../../public')
const ids = Object.keys(SCENE_STILLS) as (keyof typeof SCENE_STILLS)[]

describe('кадры сцен', () => {
  it('каждый кадр существует в public/ и весит разумно для первого экрана', () => {
    for (const id of ids) {
      const still = SCENE_STILLS[id]
      expect(still.src.startsWith('/scenes/'), id).toBe(true)
      const file = path.join(PUBLIC, still.src)
      expect(existsSync(file), `${id}: ${still.src}`).toBe(true)
      expect(statSync(file).size, id).toBeLessThan(400 * 1024)
    }
  })

  it('src уникален и содержит хэш содержимого: кадр можно кэшировать навсегда', () => {
    const srcs = ids.map(id => SCENE_STILLS[id].src)
    expect(new Set(srcs).size).toBe(srcs.length)
    for (const src of srcs) expect(src).toMatch(/\.[0-9a-f]{8}\.webp$/)
    // Один и тот же файл под двумя именами — это дубль кадра в библиотеке
    const hashes = srcs.map(src => src.match(/\.([0-9a-f]{8})\.webp$/)?.[1])
    expect(new Set(hashes).size).toBe(hashes.length)
  })

  it('точка кропа задана в процентах, размеры положительны', () => {
    for (const id of ids) {
      const still = SCENE_STILLS[id]
      expect(still.position, id).toMatch(/^\d{1,3}% \d{1,3}%$/)
      expect(still.w, id).toBeGreaterThan(0)
      expect(still.h, id).toBeGreaterThan(0)
    }
  })

  it('у каждого направления с отдельной страницей есть кадры, и все они из библиотеки', () => {
    for (const direction of SERVICE_DIRECTIONS.filter(item => item.id !== 'commercial')) {
      const list = DIRECTION_SCENES[direction.id]
      expect(list.length, direction.id).toBeGreaterThan(0)
      for (const id of list) expect(SCENE_STILLS[id], `${direction.id}: ${id}`).toBeDefined()
      expect(new Set(list).size, `${direction.id}: повтор кадра в списке`).toBe(list.length)
    }
  })

  it('в библиотеке нет лишних кадров: каждый стоит хотя бы в одном направлении', () => {
    const used = new Set(Object.values(DIRECTION_SCENES).flat())
    for (const id of ids) expect(used.has(id), `${id} не используется`).toBe(true)
  })

  it('кадр сцены безымянный: ни клиента, ни проекта, ни ссылки на кейс', () => {
    for (const id of ids) {
      const frame = sceneFrame(id)
      expect(frame.client).toBe('')
      expect(frame.slug).toBe('')
      expect(frame.title).toBe('')
      expect(isCredited(frame)).toBe(false)
      expect(frame.position).toBe(SCENE_STILLS[id].position)
    }
  })

  it('кадр работы остаётся подписанным', () => {
    const frame = { key: 'a-0', src: '/a.png', slug: 'a', client: 'A', title: 'a' }
    expect(isCredited(frame)).toBe(true)
    expect(isCredited(null)).toBe(false)
  })

  it('sceneFramesFor обрезает по limit и сохраняет порядок назначения', () => {
    const all = sceneFramesFor('fashion')
    expect(all.map(frame => frame.key)).toEqual(DIRECTION_SCENES.fashion.map(id => `scene-${id}`))
    expect(sceneFramesFor('fashion', 3)).toHaveLength(3)
    expect(sceneFramesFor('fashion', 0)).toHaveLength(0)
  })
})
