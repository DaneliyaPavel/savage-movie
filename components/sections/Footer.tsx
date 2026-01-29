/**
 * Footer с reveal анимацией в премиум стиле Freshman.tv
 * Минималистичный дизайн, появляется при скролле
 */
'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Mail, Phone, MessageCircle, Instagram, Youtube } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { GrainOverlay } from '@/components/ui/grain-overlay'

export function Footer() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <footer ref={ref} className="border-t border-[#1A1A1A] bg-[#000000] overflow-hidden relative">
      <GrainOverlay />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-16 md:mb-20">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="font-brand text-2xl md:text-3xl mb-6 text-[#FFFFFF]">SAVAGE MOVIE</h3>
            <p className="text-base md:text-lg text-[#FFFFFF]/60 font-light leading-relaxed max-w-xs">
              Полный цикл видеопродакшна от разработки креативной концепции до публикации.
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h4 className="font-heading font-semibold mb-6 text-sm md:text-base uppercase tracking-wider text-[#FFFFFF]/40">
              Навигация
            </h4>
            <ul className="space-y-3 md:space-y-4">
              {[
                { href: '/about', label: 'О нас' },
                { href: '/projects', label: 'Проекты' },
                { href: '/courses', label: 'Курсы' },
                { href: '/contact', label: 'Контакты' },
              ].map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={item.href}
                    className="text-base md:text-lg text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors relative group inline-block"
                  >
                    {item.label}
                    <motion.span
                      className="absolute bottom-0 left-0 h-[1px] bg-[#FFFFFF]"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contacts */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h4 className="font-heading font-semibold mb-6 text-sm md:text-base uppercase tracking-wider text-[#FFFFFF]/40">
              Контакты
            </h4>
            <ul className="space-y-4 md:space-y-5 text-base md:text-lg">
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <a
                  href="mailto:savage.movie@yandex.ru"
                  className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors flex items-center gap-3 group"
                >
                  <Mail className="w-5 h-5 group-hover:text-[#ff2936] transition-colors shrink-0" />
                  <span>savage.movie@yandex.ru</span>
                </a>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <a
                  href="tel:+79214021839"
                  className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors flex items-center gap-3 group"
                >
                  <Phone className="w-5 h-5 group-hover:text-[#ff2936] transition-colors shrink-0" />
                  <span>+7 921 402-18-39</span>
                </a>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 pt-2"
              >
                {[
                  { href: 'https://t.me/mariseven', icon: MessageCircle, label: 'Telegram' },
                  {
                    href: 'https://www.instagram.com/mari.seven/',
                    icon: Instagram,
                    label: 'Instagram',
                  },
                  { href: 'https://youtube.com/@savagemovie', icon: Youtube, label: 'YouTube' },
                ].map((social, index) => {
                  const Icon = social.icon
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFFFFF]/60 hover:text-[#ff2936] transition-colors"
                      aria-label={social.label}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.7 + index * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  )
                })}
              </motion.li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-[#1A1A1A] pt-8 text-center"
        >
          <p className="text-base text-[#FFFFFF]/40 font-light">
            &copy; {new Date().getFullYear()} <span className="font-brand">SAVAGE MOVIE</span>. Все
            права защищены.
          </p>
        </motion.div>
      </motion.div>
    </footer>
  )
}
