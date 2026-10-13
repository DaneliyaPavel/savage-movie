/**
 * /ai-video — «Один кадр до и после ИИ».
 *
 * Настоящая пара вместо ленты кадров с условным швом: слева исходный ролик, справа тот же ролик
 * после ИИ, файлы подогнаны друг к другу кадр в кадр (scripts/media/build-compare-pairs.mjs).
 * Шов ведёт посетитель: мышью и пальцем, с клавиатуры стрелками; пока он не тронул шов,
 * шов сам качается. Видео стартует, когда блок подошёл к экрану, до этого на месте постеры;
 * при prefers-reduced-motion, Save-Data и 2g остаются постеры, но шов тянуть по-прежнему можно.
 */
'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'

import { PairLayer } from '@/components/media/pair-layer'
import { comparePair } from '@/lib/media/compare-pairs'
import { usePairPlayback } from '@/lib/media/use-pair-playback'

import './ai-compare.css'

const PAIR = comparePair('lech')
const REST = 50
const SIZES = '(min-width: 1024px) 70vw, 100vw'

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

/** Положение шва пишется в CSS-переменную из rAF: React кадр не перерисовывает */
function useSeam(
  frameRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const frame = frameRef.current
    const handle = handleRef.current
    if (!frame || !handle) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let position = REST
    let ambient = !reduced
    let dragging = false
    let inView = false
    let raf = 0
    let started = 0

    const write = (value: number) => {
      position = clamp(value)
      frame.style.setProperty('--cmp', position.toFixed(2))
    }

    const announce = () => {
      const before = Math.round(position)
      handle.setAttribute('aria-valuenow', String(before))
      handle.setAttribute('aria-valuetext', `До ИИ ${before} %, после ИИ ${100 - before} %`)
    }

    const tick = (now: number) => {
      raf = 0
      if (!ambient || !inView || document.hidden) return
      if (!started) started = now
      write(REST + 24 * Math.sin((now - started) / 1700))
      raf = requestAnimationFrame(tick)
    }

    const kick = () => {
      if (!raf && ambient && inView && !document.hidden) raf = requestAnimationFrame(tick)
    }

    const takeOver = () => {
      ambient = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const toPercent = (clientX: number) => {
      const rect = frame.getBoundingClientRect()
      return clamp(((clientX - rect.left) / rect.width) * 100)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      takeOver()
      dragging = true
      try {
        frame.setPointerCapture(event.pointerId)
      } catch {
        // указатель уже ушёл: перетаскивание просто не начнётся
      }
      write(toPercent(event.clientX))
      announce()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return
      write(toPercent(event.clientX))
      announce()
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 10 : 2
      let next: number | null = null
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = position - step
      else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = position + step
      else if (event.key === 'PageDown') next = position - 10
      else if (event.key === 'PageUp') next = position + 10
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = 100
      if (next === null) return
      event.preventDefault()
      takeOver()
      write(next)
      announce()
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              inView = entry?.isIntersecting ?? false
              if (inView) kick()
            },
            { threshold: 0.2 }
          )
    observer?.observe(frame)

    const onVisibility = () => kick()

    frame.addEventListener('pointerdown', onPointerDown)
    frame.addEventListener('pointermove', onPointerMove)
    frame.addEventListener('pointerup', onPointerEnd)
    frame.addEventListener('pointercancel', onPointerEnd)
    handle.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibility)
    announce()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      observer?.disconnect()
      frame.removeEventListener('pointerdown', onPointerDown)
      frame.removeEventListener('pointermove', onPointerMove)
      frame.removeEventListener('pointerup', onPointerEnd)
      frame.removeEventListener('pointercancel', onPointerEnd)
      handle.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [frameRef, handleRef])
}

const FACTS = [
  { label: 'Меняется', text: 'Среда, свет и цвет' },
  { label: 'Остаётся', text: 'Движение, ракурс и композиция' },
  { label: 'Совпадение', text: 'Кадр в кадр, без сдвига по времени' },
]

export function AiCompare({
  kicker,
  title,
  lead,
}: {
  kicker: ReactNode
  title: ReactNode
  lead: ReactNode
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  usePairPlayback(frameRef)
  useSeam(frameRef, handleRef)

  return (
    <section aria-labelledby="ai-compare-title" className="dir-aic dir-ai-pad">
      <header className="dir-aic-head">
        {kicker}
        <h2 id="ai-compare-title" data-reveal="" className="dir-ai-h2 dir-aic-title">
          {title}
        </h2>
        <p className="dir-aic-lead">{lead}</p>
      </header>

      <div className="dir-aic-body">
        <div
          ref={frameRef}
          role="group"
          aria-label="Один кадр до и после ИИ"
          className="dir-aic-frame"
          style={{ '--cmp': REST } as CSSProperties}
        >
          <div className="dir-aic-layer">
            <PairLayer side="after" spec={PAIR.after} sizes={SIZES} />
          </div>
          <div className="dir-aic-layer dir-aic-before">
            <PairLayer side="before" spec={PAIR.before} sizes={SIZES} />
          </div>
          <span aria-hidden="true" className="dir-aic-line" />
          <span
            aria-hidden="true"
            className="dir-aic-tag dir-aic-tag-l type-meta-sm font-mono uppercase"
          >
            До ИИ
          </span>
          <span
            aria-hidden="true"
            className="dir-aic-tag dir-aic-tag-r type-meta-sm font-mono uppercase"
          >
            После ИИ
          </span>
          <div
            ref={handleRef}
            role="slider"
            tabIndex={0}
            aria-label="Шов между кадром до ИИ и кадром после ИИ"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={REST}
            aria-valuetext={`До ИИ ${REST} %, после ИИ ${100 - REST} %`}
            className="dir-aic-handle"
          >
            <span aria-hidden="true" className="dir-aic-grip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
              </svg>
            </span>
          </div>
        </div>

        <dl className="dir-aic-facts">
          {FACTS.map(fact => (
            <div key={fact.label} className="dir-aic-fact">
              <dt className="type-meta font-mono uppercase tabular-nums">{fact.label}</dt>
              <dd>{fact.text}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="dir-aic-note type-meta-sm font-mono uppercase tabular-nums">
        {`Фрагмент ${PAIR.duration.toFixed(1).replace('.', ',')} с · без звука · ${PAIR.fps} к/с`}
      </p>
    </section>
  )
}
