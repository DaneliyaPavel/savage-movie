import { beforeEach, describe, expect, it, vi } from 'vitest'

const getProjects = vi.fn()
const getBlogSummaries = vi.fn()

vi.mock('@/features/projects/api', () => ({ getProjects: () => getProjects() }))
vi.mock('@/lib/api/blog', () => ({ getBlogSummaries: () => getBlogSummaries() }))

import { SITE_COUNTS_TTL_MS, getSiteCounts, resetSiteCountsCache } from '../site-counts'

describe('счётчики меню', () => {
  beforeEach(() => {
    resetSiteCountsCache()
    getProjects.mockReset()
    getBlogSummaries.mockReset()
  })

  it('два одновременных открытия делят один запрос', async () => {
    getProjects.mockResolvedValue([1, 2, 3])
    getBlogSummaries.mockResolvedValue([1])

    const [first, second] = await Promise.all([getSiteCounts(0), getSiteCounts(10)])

    expect(first).toEqual({ projects: 3, blog: 1 })
    expect(second).toBe(first)
    expect(getProjects).toHaveBeenCalledTimes(1)
    expect(getBlogSummaries).toHaveBeenCalledTimes(1)
  })

  it('повторное открытие в пределах TTL не ходит в сеть, после TTL обновляет', async () => {
    getProjects.mockResolvedValue([1, 2])
    getBlogSummaries.mockResolvedValue([1, 2])

    await getSiteCounts(0)
    await getSiteCounts(SITE_COUNTS_TTL_MS - 1)
    expect(getProjects).toHaveBeenCalledTimes(1)

    await getSiteCounts(SITE_COUNTS_TTL_MS + 1)
    expect(getProjects).toHaveBeenCalledTimes(2)
  })

  it('сбой одной ручки даёт null и не запоминается', async () => {
    getProjects.mockRejectedValueOnce(new Error('502')).mockResolvedValue([1])
    getBlogSummaries.mockResolvedValue([1, 2])

    const first = await getSiteCounts(0)
    expect(first).toEqual({ projects: null, blog: 2 })

    // микрозадача, которая сбрасывает кэш при частичном сбое
    await Promise.resolve()

    const second = await getSiteCounts(1)
    expect(second).toEqual({ projects: 1, blog: 2 })
    expect(getProjects).toHaveBeenCalledTimes(2)
  })
})
