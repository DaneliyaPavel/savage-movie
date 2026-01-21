/**
 * MenuRow - строка меню в стиле venetian blinds
 * Вся строка подсвечивается при hover (как свет пробивается через жалюзи)
 */
'use client'

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
}) => (
  <div className="relative h-full overflow-hidden">
      {/* Hover highlight - акцентная полоса от пунктирной линии до пунктирной линии */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-[#ff2936] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[0.16,1,0.3,1]"
      />

      {/* Контент строки - текст выровнен по вертикали между пунктирными линиями (с небольшим смещением вниз), по горизонтали - ступеньками */}
      <div className="relative h-full flex items-center px-8 md:px-12 lg:px-16 py-4 md:py-6">
        <motion.div
          style={{ 
            marginLeft: offsetX,
            maxWidth: 'calc(100% - 2rem)', // Защита от выхода за край
            transform: 'translateY(0.5rem)' // Небольшое смещение вниз для центрирования между пунктирными линиями
          }}
          className="flex items-center gap-3 md:gap-4"
          whileHover={{ x: 4 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
        {/* Текст меню - крупный, редакторский (белый на черном фоне) */}
        <span
          className={`font-heading font-bold text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl leading-none transition-colors duration-300 ${
            isCTA
              ? 'text-[#FFFFFF] group-hover:text-[#000000]'
              : 'text-[#FFFFFF] group-hover:text-[#000000]'
          }`}
        >
          {label}
        </span>

        {/* Счетчик (если есть) */}
        {count !== undefined && (
          <span className="text-lg md:text-xl lg:text-2xl text-[#FFFFFF]/40 group-hover:text-[#000000]/60 font-mono transition-colors duration-300">
            ({count})
          </span>
        )}

        {/* Стрелка для CTA */}
        {isCTA && (
          <motion.span
            className="text-3xl md:text-4xl text-[#FFFFFF] group-hover:text-[#000000] transition-colors duration-300"
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            →
          </motion.span>
        )}
      </motion.div>
    </div>
  </div>
)

export function MenuRow({ 
  label, 
  href, 
  count, 
  offsetX = '0%', 
  isCTA = false,
  index,
  onClose,
  onCTAClick
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
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative group"
    >
      {/* Вся строка - кликабельная область */}
      {isCTA || href === '#' ? (
        <button
          onClick={handleClick}
          className="relative block h-full w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2936] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000] text-left"
        >
          <RowContent label={label} count={count} isCTA={isCTA} offsetX={offsetX} />
        </button>
      ) : (
        <Link
          href={href}
          onClick={handleClick}
          className="relative block h-full w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2936] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]"
        >
          <RowContent label={label} count={count} isCTA={isCTA} offsetX={offsetX} />
        </Link>
      )}
    </motion.div>
  )
}
