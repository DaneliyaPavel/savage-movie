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
            className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 text-[#FFFFFF] hover:text-[#ff2936] transition-colors group"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Меню'}
            aria-expanded={isMenuOpen}
          >
            {/* Hamburger/X icon - три линии трансформируются в X */}
            <div className="relative w-5 h-4 md:w-6 md:h-5 flex flex-col justify-center items-center">
              {/* Верхняя линия */}
              <motion.span
                className="absolute h-[2px] w-full bg-current origin-center"
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 0 : -6,
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Средняя линия */}
              <motion.span
                className="absolute h-[2px] w-full bg-current"
                animate={{
                  opacity: isMenuOpen ? 0 : 1,
                  scale: isMenuOpen ? 0.8 : 1,
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Нижняя линия */}
              <motion.span
                className="absolute h-[2px] w-full bg-current origin-center"
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? 0 : 6,
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {/* МЕНЮ / ЗАКРЫТЬ text */}
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
