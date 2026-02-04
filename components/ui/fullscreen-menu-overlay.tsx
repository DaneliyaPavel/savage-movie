/**
 * Fullscreen Menu Overlay в стиле Venetian Blinds
 * Редакторский, кинематографический стиль как на Freshman.tv
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuRow } from './menu-row'
import { GrainOverlay } from './grain-overlay'
import { LanguageToggle } from './language-toggle'

interface MenuItem {
  label: string
  href: string
  count?: number
  offsetX?: string
  isCTA?: boolean
}

interface FullscreenMenuOverlayProps {
  isOpen: boolean
  onClose: () => void
  items: MenuItem[]
  onCTAClick?: () => void
}

export function FullscreenMenuOverlay({
  isOpen,
  onClose,
  items,
  onCTAClick,
}: FullscreenMenuOverlayProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Блокируем скролл при открытом меню
  useEffect(() => {
    let resetTimer: number | undefined
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Сброс фокуса
      resetTimer = window.setTimeout(() => setFocusedIndex(0), 0)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      if (resetTimer !== undefined) window.clearTimeout(resetTimer)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Закрытие по ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Клавиатурная навигация (Arrow Up/Down)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1))
      } else if (e.key === 'Enter' && items[focusedIndex]) {
        e.preventDefault()
        const item = items[focusedIndex]
        if (item.isCTA && onCTAClick) {
          onClose()
          setTimeout(() => onCTAClick(), 300)
        } else if (item.href !== '#') {
          onClose()
          setTimeout(() => {
            window.location.href = item.href
          }, 300)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, items, onClose, onCTAClick])

  // Вычисляем высоту строки - равномерно распределяем доступное пространство
  // Вычитаем высоту top bar (~100px) и padding
  const availableHeight = 'calc(100vh - 200px)'
  const rowHeight = items.length > 0 ? `calc(${availableHeight} / ${items.length})` : '100px'

  const handleCTAClick = () => {
    if (onCTAClick) {
      onClose()
      // Небольшая задержка для плавного закрытия
      setTimeout(() => {
        onCTAClick()
      }, 300)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay background - теплый светло-серый фон как на Freshman.tv */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] menu-bg-warm"
            onClick={onClose}
          >
            <GrainOverlay />
          </motion.div>

          {/* Menu container - dramatic slide in with blur для премиум ощущения */}
          <motion.div
            ref={menuRef}
            initial={{ y: '-100%', opacity: 0, scale: 0.96, rotate: -0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{
              y: '-100%',
              opacity: 0,
              scale: 0.96,
              rotate: -0.5,
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.5 },
            }}
            className="fixed inset-0 z-[101] flex flex-col"
          >
            {/* Top bar: Language toggle (кнопка закрыть теперь в Navigation) */}
            <div className="flex items-center justify-between px-6 md:px-8 lg:px-12 pt-6 md:pt-8 lg:pt-12 pb-4">
              {/* Language Toggle - Top Left */}
              <LanguageToggle />

              {/* Правая сторона пустая - кнопка закрыть теперь в Navigation */}
              <div className="w-12 h-12 md:w-14 md:h-14" />
            </div>

            {/* Menu Rows - заполняют остальное пространство */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden">
              <div className="space-y-0">
                {items.map((item, index) => (
                  <div
                    key={`${item.href}-${index}`}
                    style={{
                      height: rowHeight,
                      minHeight: '100px',
                      maxHeight: '200px',
                    }}
                    className="relative"
                  >
                    <MenuRow
                      {...item}
                      index={index}
                      onClose={onClose}
                      onCTAClick={item.isCTA && onCTAClick ? handleCTAClick : undefined}
                    />
                    {/* Dotted separator снизу (темный на светлом теплом фоне) */}
                    {index < items.length - 1 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-px opacity-30"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(to right, #2a2a2a 0px, #2a2a2a 3px, transparent 3px, transparent 7px)',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
