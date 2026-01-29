/**
 * Премиум навигация с Venetian Blinds меню в стиле Freshman.tv
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FullscreenMenuOverlay } from '@/components/ui/fullscreen-menu-overlay'
import type { User } from '@/lib/api/auth'

interface NavigationProps {
  onBookClick?: () => void
  user?: User | null
}

// Пункты меню "ступеньками" от левого края до правого
const navItems = [
  { href: '/about', label: 'О нас', offsetX: '0%' }, // Слева
  { href: '/projects', label: 'Проекты', offsetX: '20%' }, // Немного правее
  { href: '/courses', label: 'Курсы', offsetX: '40%' }, // Еще правее
  { href: '/contact', label: 'Контакты', offsetX: '60%' }, // Еще правее
]

export function Navigation({ onBookClick, user }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  void user

  // Формируем пункты меню для FullscreenMenuOverlay
  // Добавляем CTA в конец если есть
  const menuItems = [
    ...navItems,
    ...(onBookClick
      ? [
          {
            href: '#',
            label: 'Обсудить проект',
            offsetX: '75%',
            isCTA: true as const,
          },
        ]
      : []),
  ]

  const handleCTAClick = () => {
    if (onBookClick) {
      setIsMenuOpen(false)
      onBookClick()
    }
  }

  return (
    <>
      {/* Header - минималистичный, логотип слева, кнопка меню справа */}
      <nav className="fixed top-0 left-0 right-0 z-[102] bg-transparent pointer-events-none">
        {/* Логотип слева - размером как меню */}
        <div className="absolute top-0 left-0 z-[102] pointer-events-auto">
          <Link
            href="/"
            className="block px-4 md:px-6 py-3 md:py-4 font-brand text-sm md:text-base text-[#FFFFFF] hover:text-[#ff2936] transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            SAVAGE MOVIE
          </Link>
        </div>

        {/* Кнопка меню справа */}
        <div className="absolute top-0 right-0 z-[102] pointer-events-auto">
          {/* Кнопка меню в стиле "+ МЕНЮ" / "X ЗАКРЫТЬ" в правом верхнем углу */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 text-[#FFFFFF] hover:text-[#ff2936] transition-colors group"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Меню'}
            aria-expanded={isMenuOpen}
          >
            {/* Plus/Cross icon с плавным вращением - всегда показываем плюс, вращаем на 45° */}
            <motion.span
              animate={{ rotate: isMenuOpen ? 45 : 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl md:text-2xl font-light leading-none relative w-6 h-6 flex items-center justify-center"
              style={{ transformOrigin: 'center' }}
            >
              <span>+</span>
            </motion.span>
            {/* МЕНЮ / ЗАКРЫТЬ text - одинаковый размер */}
            <span className="text-sm md:text-base font-medium uppercase tracking-wider">
              {isMenuOpen ? 'ЗАКРЫТЬ' : 'МЕНЮ'}
            </span>
          </button>
        </div>
      </nav>

      {/* Fullscreen Venetian Blinds Menu */}
      <FullscreenMenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={menuItems}
        onCTAClick={onBookClick ? handleCTAClick : undefined}
      />
    </>
  )
}
