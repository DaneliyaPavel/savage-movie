'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useMenu } from './menu-context'
import { useI18n } from '@/lib/i18n-context'

export function TopBar() {
  const { toggle, isOpen, headerDark } = useMenu()
  const { t } = useI18n()

  const textColor = headerDark ? 'text-background' : 'text-white'
  const lineColor = headerDark ? 'bg-background' : 'bg-white'
  const logoFilter = headerDark ? '' : 'invert'

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-5 md:px-10 transition-colors duration-300"
    >
      {/* Logo */}
      <Link href="/" className="group relative">
        <span className="inline-flex items-center">
          <Image
            src="/sm-logo.svg"
            alt="Savage Movie"
            width={96}
            height={38}
            className={`h-6 md:h-7 w-auto ${logoFilter} transition-[filter] duration-300`}
            priority
          />
        </span>
        <motion.span
          className={`absolute -bottom-1 left-0 h-px ${lineColor} origin-left`}
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%' }}
        />
      </Link>

      {/* Menu Button */}
      <button
        onClick={toggle}
        className={`group relative flex items-center gap-3 ${textColor} transition-colors duration-300`}
        aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
      >
        <span className="text-sm font-medium tracking-wide uppercase opacity-60 group-hover:opacity-100 transition-opacity">
          {t('nav.menu')}
        </span>
        <div className="relative w-8 h-8 flex items-center justify-center">
          <motion.span
            className={`absolute w-5 h-px ${lineColor} transition-colors duration-300`}
            animate={isOpen ? { rotate: 45 } : { rotate: 0, y: -3 }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            className={`absolute w-5 h-px ${lineColor} transition-colors duration-300`}
            animate={isOpen ? { rotate: -45 } : { rotate: 0, y: 3 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </button>
    </motion.header>
  )
}
