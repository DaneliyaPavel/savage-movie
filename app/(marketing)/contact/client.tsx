/**
 * Клиентский компонент страницы Contact с анимациями
 */
'use client'

import { ContactForm } from '@/components/sections/ContactForm'
import { Mail, Phone, MessageCircle, Instagram, Youtube } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { EditorialCorrection } from '@/components/ui/editorial-correction'
import { HoverNote } from '@/components/ui/hover-note'

export function ContactPageClient() {
  return (
    <div className="min-h-screen pt-20 pb-0 bg-[#000000]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 md:mb-32 editorial-spacing"
        >
          <div className="mb-8">
            <EditorialCorrection wrong="Контакты" correct="Давайте обсудим" size="xl" delay={0.2} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light max-w-3xl"
          >
            Свяжитесь с нами любым удобным способом
          </motion.p>
        </motion.div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-20 md:mb-32">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <HoverNote text="trusted by" position="top">
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12 text-[#FFFFFF]">
                Контактная информация
              </h2>
            </HoverNote>
            <div className="space-y-8">
              <motion.a
                href="mailto:savage.movie@yandex.ru"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-[#1A1A1A] group-hover:border-[#FFFFFF] transition-colors">
                  <Mail className="w-5 h-5 text-[#FFFFFF]/60 group-hover:text-[#ff2936] transition-colors" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-[#FFFFFF]/40 mb-1 uppercase tracking-wider">Email</p>
                  <p className="text-base md:text-lg font-medium text-[#FFFFFF] group-hover:text-[#ff2936] transition-colors">
                    savage.movie@yandex.ru
                  </p>
                </div>
              </motion.a>
              <motion.a
                href="tel:+79214021839"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-[#1A1A1A] group-hover:border-[#FFFFFF] transition-colors">
                  <Phone className="w-5 h-5 text-[#FFFFFF]/60 group-hover:text-[#ff2936] transition-colors" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-[#FFFFFF]/40 mb-1 uppercase tracking-wider">Телефон</p>
                  <p className="text-base md:text-lg font-medium text-[#FFFFFF] group-hover:text-[#ff2936] transition-colors">
                    +7 921 402-18-39
                  </p>
                </div>
              </motion.a>
            </div>
          </motion.div>

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12 text-[#FFFFFF]">
              Социальные сети
            </h2>
            <div className="space-y-4">
              {[
                { href: 'https://t.me/mariseven', icon: MessageCircle, label: 'Telegram' },
                { href: 'https://www.instagram.com/mari.seven/', icon: Instagram, label: 'Instagram' },
                { href: 'https://youtube.com/@savagemovie', icon: Youtube, label: 'YouTube' },
              ].map((social, index) => {
                const Icon = social.icon
                return (
                  <motion.div
                    key={social.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center border border-[#1A1A1A] group-hover:border-[#FFFFFF] transition-colors">
                        <Icon className="w-5 h-5 text-[#FFFFFF]/60 group-hover:text-[#ff2936] transition-colors" />
                      </div>
                      <span className="text-base md:text-lg font-medium text-[#FFFFFF] group-hover:text-[#ff2936] transition-colors">
                        {social.label}
                      </span>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Form с бюджет слайдером */}
      <ContactForm />
    </div>
  )
}
