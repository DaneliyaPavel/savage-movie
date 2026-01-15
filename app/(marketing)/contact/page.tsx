/**
 * Страница контактов
 */
'use client'

import { CTASection } from '@/components/sections/CTASection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, MessageCircle, Instagram, Youtube } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ContactPage() {
  return (
    <div className="min-h-screen py-20 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading font-bold text-6xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            Контакты
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto font-light"
          >
            Свяжитесь с нами любым удобным способом
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl md:text-3xl font-heading mb-2">
                  Контактная информация
                </CardTitle>
                <CardDescription className="text-base">
                  Мы всегда рады ответить на ваши вопросы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <motion.a
                  href="mailto:savage.movie@yandex.ru"
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                      savage.movie@yandex.ru
                    </p>
                  </div>
                </motion.a>
                <motion.a
                  href="tel:+79214021839"
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Телефон</p>
                    <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                      +7 921 402-18-39
                    </p>
                  </div>
                </motion.a>
                <div className="flex items-center gap-4 p-4 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Местоположение</p>
                    <p className="font-semibold text-lg">Россия</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl md:text-3xl font-heading mb-2">
                  Социальные сети
                </CardTitle>
                <CardDescription className="text-base">
                  Следите за нашими обновлениями
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex flex-col gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="https://t.me/mariseven"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all group border border-border/50"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <MessageCircle className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-lg group-hover:text-primary transition-colors">
                        Telegram
                      </span>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="https://www.instagram.com/mari.seven/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all group border border-border/50"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Instagram className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-lg group-hover:text-primary transition-colors">
                        Instagram
                      </span>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="https://youtube.com/@savagemovie"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all group border border-border/50"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Youtube className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-lg group-hover:text-primary transition-colors">
                        YouTube
                      </span>
                    </Link>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Contact Form */}
        <CTASection />
      </div>
    </div>
  )
}
