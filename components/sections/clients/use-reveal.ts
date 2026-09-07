'use client'

import { useEffect, useRef } from 'react'

/**
 * Появление блоков при скролле, которое не прячет контент.
 *
 * Элементы с атрибутом data-reveal сдвинуты вниз на 18px и распрямляются,
 * когда входят в экран. Анимируется только transform — прозрачность не
 * трогаем сознательно: framer-motion выставляет initial={{opacity:0}}
 * инлайном ещё на SSR, и блок оказывается невидимым на первом отрисованном
 * кадре, пока не доедет JS. Стиль лежит в globals.css ([data-reveal]).
 *
 * Без IntersectionObserver всё сразу переводится в конечное состояние.
 *
 * rescanKey нужен спискам, которые досыпают элементы после первого рендера
 * («показать больше» на /projects): наблюдатель заводится один раз на монтаж,
 * и без пересканирования дописанные строки не получили бы reveal вовсе.
 * Вызов без аргумента — прежнее поведение, эффект отрабатывает единожды.
 */
export function useReveal<T extends HTMLElement>(rescanKey?: unknown) {
  const rootRef = useRef<T>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Уже раскрытые пропускаем: на пересканировании их незачем наблюдать снова
    const isPending = (node: HTMLElement) => node.dataset.reveal !== 'shown'
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
      isPending
    )
    if (root.hasAttribute('data-reveal') && isPending(root)) targets.push(root)
    if (targets.length === 0) return

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach(target => {
        target.dataset.reveal = 'shown'
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const target = entry.target as HTMLElement
          target.dataset.reveal = 'shown'
          obs.unobserve(target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 }
    )

    targets.forEach(target => observer.observe(target))
    return () => observer.disconnect()
  }, [rescanKey])

  return rootRef
}
