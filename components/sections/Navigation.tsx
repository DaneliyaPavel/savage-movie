/**
 * Минималистичная навигация в стиле The Up&Up Group
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationProps {
  onBookClick?: () => void
}

const navItems = [
  { href: '/about', label: 'О нас' },
  { href: '/projects', label: 'Проекты' },
  { href: '/courses', label: 'Курсы' },
  { href: '/contact', label: 'Контакты' },
]

export function Navigation({ onBookClick }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="font-heading font-bold text-xl md:text-2xl text-foreground hover:text-primary transition-colors"
          >
            SAVAGE MOVIE
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={onBookClick}
              className="border-foreground/30 hover:bg-foreground hover:text-background rounded-none"
            >
              Обсудить проект
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/30 bg-background"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                variant="outline"
                className="w-full mt-4 rounded-none"
                onClick={() => {
                  setIsOpen(false)
                  onBookClick?.()
                }}
              >
                Обсудить проект
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
