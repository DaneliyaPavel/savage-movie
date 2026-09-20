'use client'

import { useEffect, useState } from 'react'

/**
 * Какая сцена сейчас главная на экране.
 *
 * Раздел направлений — последовательность полноэкранных сцен, и ровно одна из
 * них в каждый момент должна вести себя как активный кадр: играть своё видео,
 * подсвечивать свой номер в индексе, отдавать событие просмотра. Всё остальное
 * молчит — иначе браузер тянет семь потоков ради одного видимого.
 *
 * Активной считается сцена, попавшая в среднюю полосу экрана: rootMargin
 * срезает по 38% сверху и снизу, поэтому в зоне наблюдения почти всегда
 * оказывается один элемент, а на стыке двух сцен выигрывает та, что покрывает
 * полосу сильнее. Пороговая сетка нужна именно для сравнения: без неё браузер
 * сообщает только факт пересечения и «сильнее» не из чего вычислить.
 *
 * null означает «монтаж ещё не начался»: так первый экран остаётся чистым,
 * а индекс не заявляет о направлении, до которого человек не доскроллил.
 *
 * Без IntersectionObserver активной сцены не появляется вовсе: страница при
 * этом полностью читаема, просто медиа остаётся кадрами и индекс молчит.
 */
export function useActiveScene(sceneIds: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (sceneIds.length === 0) return

    const nodes = sceneIds
      .map(id => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node))
    if (nodes.length === 0) return

    if (typeof IntersectionObserver === 'undefined') return

    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        let bestId: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestId = id
            bestRatio = ratio
          }
        }

        // Ни одна сцена не в полосе — между сценами или на первом экране.
        // Прежнюю активную не сбрасываем: мигание индекса на каждом стыке
        // читается как сбой, а не как монтаж.
        if (bestId) setActiveId(bestId)
      },
      {
        rootMargin: '-38% 0px -38% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [sceneIds])

  return activeId
}
