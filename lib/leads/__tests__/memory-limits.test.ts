import { describe, expect, it } from 'vitest'

import { createRateLimiter, createRecentSet, PRUNE_INTERVAL_MS } from '../memory-limits'

const HOUR = 60 * 60 * 1000

describe('createRateLimiter', () => {
  it('пускает limit обращений за окно и блокирует следующее', () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: HOUR, maxKeys: 100 })

    for (let index = 0; index < 5; index += 1) {
      expect(limiter.isLimited('10.0.0.1', 1000 + index)).toBe(false)
    }
    expect(limiter.isLimited('10.0.0.1', 2000)).toBe(true)
  })

  it('считает каждый ключ отдельно', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: HOUR, maxKeys: 100 })

    expect(limiter.isLimited('a', 0)).toBe(false)
    expect(limiter.isLimited('b', 0)).toBe(false)
    expect(limiter.isLimited('a', 1)).toBe(true)
  })

  it('освобождает ключ, когда обращения выходят из окна', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: HOUR, maxKeys: 100 })

    limiter.isLimited('a', 0)
    limiter.isLimited('a', 1)
    expect(limiter.isLimited('a', 2)).toBe(true)
    expect(limiter.isLimited('a', HOUR + 2)).toBe(false)
  })

  it('отклонённые обращения не продлевают блок', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: HOUR, maxKeys: 100 })

    limiter.isLimited('a', 0)
    for (let index = 1; index <= 20; index += 1) {
      expect(limiter.isLimited('a', index * 1000)).toBe(true)
    }
    // Окно считается от единственной принятой попытки, а не от последней долбёжки
    expect(limiter.isLimited('a', HOUR + 1)).toBe(false)
  })

  it('число ключей в памяти не превышает maxKeys при потоке разных адресов', () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: HOUR, maxKeys: 50 })

    for (let index = 0; index < 5000; index += 1) {
      limiter.isLimited(`198.51.100.${index}`, index)
      expect(limiter.size()).toBeLessThanOrEqual(50)
    }
    expect(limiter.size()).toBe(50)
  })

  it('при переполнении вытесняет самый давний ключ и не отказывает новым', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: HOUR, maxKeys: 3 })

    limiter.isLimited('old', 0)
    limiter.isLimited('b', 1)
    limiter.isLimited('c', 2)
    // Четвёртый, новый адрес принимается, а не получает отказ из-за забитой памяти
    expect(limiter.isLimited('new', 3)).toBe(false)
    expect(limiter.size()).toBe(3)
    // «old» вытеснен — счётчик начался заново; «c» держится
    expect(limiter.isLimited('old', 4)).toBe(false)
    expect(limiter.isLimited('c', 5)).toBe(true)
  })

  it('недавно активный ключ вытесняется последним', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: HOUR, maxKeys: 3 })

    limiter.isLimited('a', 0)
    limiter.isLimited('b', 1)
    limiter.isLimited('c', 2)
    // «a» снова активен (получил отказ) и уходит в конец очереди вытеснения
    expect(limiter.isLimited('a', 3)).toBe(true)
    limiter.isLimited('d', 4)
    expect(limiter.isLimited('a', 5)).toBe(true)
  })

  it('чистка просроченного идёт не чаще раза в минуту', () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 10_000, maxKeys: 1000 })

    limiter.isLimited('first', 0)
    limiter.isLimited('second', 1)
    expect(limiter.size()).toBe(2)

    // Записи давно просрочены (окно 10 с), но с последней чистки прошло меньше минуты
    limiter.isLimited('third', PRUNE_INTERVAL_MS - 1)
    expect(limiter.size()).toBe(3)

    // Прошла минута — просроченные уходят
    limiter.isLimited('fourth', PRUNE_INTERVAL_MS)
    expect(limiter.size()).toBe(2)
  })

  it('maxKeys меньше единицы не ломает лимитер', () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: HOUR, maxKeys: 0 })

    expect(limiter.isLimited('a', 0)).toBe(false)
    expect(limiter.isLimited('b', 1)).toBe(false)
    expect(limiter.size()).toBe(1)
  })
})

describe('createRecentSet', () => {
  it('помнит ключ в пределах окна и забывает после него', () => {
    const recent = createRecentSet({ windowMs: 10 * 60 * 1000, maxKeys: 100 })

    expect(recent.has('fp', 0)).toBe(false)
    recent.add('fp', 0)
    expect(recent.has('fp', 5 * 60 * 1000)).toBe(true)
    expect(recent.has('fp', 10 * 60 * 1000)).toBe(false)
  })

  it('число ключей в памяти не превышает maxKeys', () => {
    const recent = createRecentSet({ windowMs: HOUR, maxKeys: 40 })

    for (let index = 0; index < 3000; index += 1) {
      recent.add(`fingerprint-${index}`, index)
      expect(recent.size()).toBeLessThanOrEqual(40)
    }
    expect(recent.size()).toBe(40)
    // Новейшие остались, самые давние вытеснены
    expect(recent.has('fingerprint-2999', 3000)).toBe(true)
    expect(recent.has('fingerprint-0', 3000)).toBe(false)
  })

  it('чистка просроченного идёт не чаще раза в минуту', () => {
    const recent = createRecentSet({ windowMs: 10_000, maxKeys: 1000 })

    recent.add('a', 0)
    recent.add('b', 1)
    recent.add('c', PRUNE_INTERVAL_MS - 1)
    expect(recent.size()).toBe(3)

    recent.add('d', PRUNE_INTERVAL_MS)
    expect(recent.size()).toBe(2)
  })
})
