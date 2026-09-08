/**
 * Creative Preloader - Red Background + Technical Scribbles
 * Matches the chaotic/creative vibe of Freshman.tv
 */
'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PreloaderProps {
  onComplete?: () => void
  /** Момент, когда ident начал уходить: под него подводится вход первого экрана */
  onExitStart?: () => void
}

const TECHNICAL_SPECS = [
  '23.976 FPS',
  'SHUTTER: 180°',
  'ISO 800',
  'WB 5600K',
  'ANAMORPHIC',
  '4:3',
  'PRORES 4444',
  'RAW',
  'REC,709',
  'LUT: SAVAGE_V2',
  'LENS: 35MM',
  'T2.0',
]

const SCRIBBLES = [
  // Box
  <svg key="box" viewBox="0 0 100 100" className="w-full h-full stroke-white stroke-2 fill-none">
    <path d="M10,10 L90,10 L90,90 L10,90 Z" strokeDasharray="1000" strokeDashoffset="0" />
  </svg>,
  // Circle-ish
  <svg key="circle" viewBox="0 0 100 100" className="w-full h-full stroke-white stroke-2 fill-none">
    <path d="M50,10 C80,10 90,40 90,50 C90,80 60,90 50,90 C20,90 10,60 10,50 C10,20 40,10 50,10" />
  </svg>,
  // Arrow
  <svg key="arrow" viewBox="0 0 100 100" className="w-full h-full stroke-white stroke-2 fill-none">
    <path d="M10,50 L90,50 M60,20 L90,50 L60,80" />
  </svg>,
  // Cross
  <svg key="cross" viewBox="0 0 100 100" className="w-full h-full stroke-white stroke-2 fill-none">
    <path d="M20,20 L80,80 M80,20 L20,80" />
  </svg>,
  // Zigzag
  <svg key="zigzag" viewBox="0 0 100 100" className="w-full h-full stroke-white stroke-2 fill-none">
    <path d="M10,50 L30,20 L50,80 L70,20 L90,50" />
  </svg>,
]

/*
 * Заставка — не загрузчик, а короткий ident студии: контент под ней уже
 * отрисован сервером, и плохая сеть не имеет права её удлинять. Поэтому
 * последовательность живёт на собственных таймерах и ничего не ждёт.
 *
 * BEAT   — один кадр красного поля;
 * EXIT   — уход; начинается одновременно с входом первого экрана, чтобы hero
 *          поднимался ПОД уходящей заставкой, а не после неё;
 * SPEC   — смена спецификации ровно одна: прежние 120 мс давали около
 *          одиннадцати смен за показ и читались как мерцание, а не как
 *          техническая шапка плёнки.
 */
const BEAT_MS = 300
const EXIT_MS = 260
const SPEC_MS = 240

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Preloader({ onComplete, onExitStart }: PreloaderProps) {
  const [currentSpec, setCurrentSpec] = useState(0)
  const [currentScribble, setCurrentScribble] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // При выключенном движении заставка скрыта стилем — мигать нечему
    const interval = prefersReducedMotion()
      ? null
      : setInterval(() => {
          setCurrentSpec(prev => (prev + 1) % TECHNICAL_SPECS.length)
          setCurrentScribble(prev => (prev + 1) % SCRIBBLES.length)
        }, SPEC_MS)

    const exitTimer = setTimeout(() => {
      /*
       * Смену спецификаций останавливаем вместе с началом ухода. Помимо
       * режиссуры — ident уходит одним кадром, а не продолжает тикать —
       * это убирает ре-рендеры во время затухания: на них Framer успевал
       * вернуть непрозрачность на один кадр, и красное поле моргало
       * обратно уже почти исчезнув.
       */
      if (interval) clearInterval(interval)
      setIsFinishing(true)
      onExitStart?.()
    }, BEAT_MS)

    /*
     * Завершение по таймеру, а не по onAnimationComplete: rAF не тикает в
     * фоновой вкладке, и заставка, начатая перед переключением, оставалась бы
     * висеть до возвращения. Таймер закрывает её в срок в любом случае.
     */
    const doneTimer = setTimeout(() => {
      setHidden(true)
      onComplete?.()
    }, BEAT_MS + EXIT_MS)

    return () => {
      if (interval) clearInterval(interval)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete, onExitStart])

  if (hidden) return null

  return (
    /*
     * Затухание — CSS-переход, а не инлайновая анимация Framer. Framer держит
     * прозрачность инлайновым стилем и в момент завершения анимации отдаёт её
     * обратно базовому значению: уже исчезнувшее красное поле моргало на один
     * кадр в полную силу. CSS-переход такого стыка не имеет, идёт вне главного
     * потока и заодно убирает последний инлайновый opacity из разметки.
     *
     * preloader-overlay — зацепка для no-JS фолбэка и предохранителя,
     * см. <noscript> в showreel-hero и globals.css.
     */
    <div
      data-exiting={isFinishing}
      className="preloader-overlay fixed inset-0 z-[9999] bg-[#FF322E] flex items-center justify-center overflow-hidden"
    >
      {/* Central Chaos Container */}
      <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
        {/* Flashing Scribbles */}
        <div className="absolute inset-0 opacity-80 mix-blend-screen">
          {SCRIBBLES[currentScribble]}
        </div>

        {/* Flashing Technical Text - Random positions ideally, but centered is cleaner for now */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.p
            key={currentSpec}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.1 }}
            transition={{ duration: 0.1 }}
            className="text-4xl md:text-6xl font-mono text-white font-bold tracking-tighter mix-blend-overlay whitespace-nowrap"
          >
            {TECHNICAL_SPECS[currentSpec]}
          </motion.p>
        </div>

        {/* Static Grid lines */}
        <div className="absolute inset-0 border border-white/20" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-xs font-mono text-white/50 tracking-[0.5em] uppercase">
          INITIATING SEQUENCE
        </p>
      </div>
    </div>
  )
}
