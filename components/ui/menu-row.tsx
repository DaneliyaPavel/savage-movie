/**
 * MenuRow - строка меню в стиле venetian blinds
 * Вся строка подсвечивается при hover (как свет пробивается через жалюзи)
 */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface MenuRowProps {
  label: string
  href: string
  count?: number
  offsetX?: string // CSS offset для арт-дирекшна: '0%', '10%', '20%' и т.д.
  isCTA?: boolean
  index: number
  onClose: () => void
  onCTAClick?: () => void // Дополнительный обработчик для CTA
}

const RowContent = ({
  label,
  count,
  isCTA,
  offsetX,
}: {
  label: string
  count?: number
  isCTA: boolean
  offsetX: string
}) => {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className="relative h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle hover highlight - мягкая подсветка вместо яркого красного */}
      <motion.div
        className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-[#a8a199]/0 via-[#9a9389]/8 to-[#a8a199]/0"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.95 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Контент строки - элегантная типографика с каскадным расположением */}
      <div className="relative h-full flex items-center px-8 md:px-12 lg:px-16 py-4 md:py-6">
        <motion.div
          style={{
            marginLeft: offsetX,
            maxWidth: 'calc(100% - 2rem)',
            transform: 'translateY(0.3rem)',
          }}
          className="flex items-center gap-2 md:gap-3"
          animate={{
            x: isHovered ? 8 : 0,
            scale: isHovered ? 1.005 : 1
          }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            scale: { type: "spring", stiffness: 300, damping: 30 }
          }}
        >
          {/* Wrapper для текста с анимированным подчеркиванием */}
          <div className="relative inline-block">
            {/* Текст меню - утонченная serif типографика */}
            <motion.span
              className="font-playfair font-normal text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-none menu-text-elegant"
              style={{ letterSpacing: '-0.015em' }}
              animate={{
                color: isHovered ? '#000000' : '#1a1a1a',
                letterSpacing: isHovered ? '-0.005em' : '-0.015em',
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {label}
            </motion.span>

            {/* Анимированное подчеркивание при hover - как на freshman.tv */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-[#1a1a1a]"
              initial={{ width: 0 }}
              animate={{ width: isHovered ? '100%' : 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Счетчик - элегантное отображение */}
          {count !== undefined && (
            <motion.span
              className="text-base md:text-lg lg:text-xl font-mono"
              animate={{
                color: isHovered ? 'rgba(0, 0, 0, 0.7)' : 'rgba(26, 26, 26, 0.5)',
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              ({count})
            </motion.span>
          )}

          {/* Стрелка для CTA - улучшенная анимация */}
          {isCTA && (
            <motion.span
              className="text-2xl md:text-3xl"
              animate={{
                color: isHovered ? '#000000' : '#1a1a1a',
                x: [0, 8, 0],
              }}
              transition={{
                color: { duration: 0.5 },
                x: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: [0.45, 0, 0.55, 1],
                  repeatDelay: 0.5,
                }
              }}
            >
              →
            </motion.span>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export function MenuRow({
  label,
  href,
  count,
  offsetX = '0%',
  isCTA = false,
  index,
  onClose,
  onCTAClick,
}: MenuRowProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (isCTA || href === '#') {
      e.preventDefault()
      onClose()
      // Если есть специальный обработчик CTA - вызываем его
      if (onCTAClick) {
        setTimeout(() => {
          onCTAClick()
        }, 300) // Задержка для плавного закрытия
      }
      return
    }

    // Для обычных ссылок - закрываем меню, навигация произойдет через Link
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -50, y: 20, rotate: -1.5 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
        rotate: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
      }}
      className="relative group"
    >
      {/* Вся строка - кликабельная область */}
      {isCTA || href === '#' ? (
        <button
          onClick={handleClick}
          className="relative block h-full w-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a2a2a]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#B8B1A8] text-left hover:bg-[#9a9389]/5"
        >
          <RowContent label={label} count={count} isCTA={isCTA} offsetX={offsetX} />
        </button>
      ) : (
        <Link
          href={href}
          onClick={handleClick}
          className="relative block h-full w-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a2a2a]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#B8B1A8] hover:bg-[#9a9389]/5"
        >
          <RowContent label={label} count={count} isCTA={isCTA} offsetX={offsetX} />
        </Link>
      )}
    </motion.div>
  )
}
