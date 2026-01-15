/**
 * Страница "О нас"
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Award, Users, Film } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="min-h-screen py-20 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading font-bold text-6xl md:text-7xl lg:text-8xl mb-8 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            О нас
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-muted-foreground text-xl md:text-2xl max-w-4xl mx-auto font-light leading-relaxed"
          >
            Смотрим на мир через объектив кинокамеры. Работаем с лучшими исполнителями, 
            чтобы рассказать о вас миру с помощью современных технологий и креатива.
          </motion.p>
        </motion.div>

        {/* Brand Story */}
        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-heading font-bold text-4xl md:text-5xl mb-8 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Наша история
              </h2>
              <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <p>
                  Мы работаем так, чтобы люди смотрели, а вам всегда хотелось сказать: 
                  "Это именно то, что нужно!"
                </p>
                <p>
                  SAVAGE MOVIE — это команда профессионалов, которые создают видеоконтент 
                  высочайшего качества. От коммерческих роликов до музыкальных клипов, 
                  от ИИ-генерации до полного цикла продакшна.
                </p>
                <p>
                  Мы не просто снимаем видео — мы создаем истории, которые вдохновляют, 
                  продают и запоминаются.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 shadow-2xl"
            >
              {/* Placeholder для изображения или видео */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="w-24 h-24 text-primary/30" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-32">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading font-bold text-4xl md:text-5xl mb-12 text-center bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            Команда
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 h-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <CardContent className="p-8 text-center relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="mb-6"
                  >
                    <Avatar className="w-32 h-32 mx-auto border-4 border-primary/20">
                      <AvatarImage src="/team/placeholder.jpg" alt="Команда" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-3xl font-bold">
                        SM
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <h3 className="font-heading font-bold text-2xl mb-2">SAVAGE MOVIE</h3>
                  <p className="text-muted-foreground text-lg">Видеограф и Продюсер</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-32">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading font-bold text-4xl md:text-5xl mb-16 text-center bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            Достижения
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Film, value: '100+', label: 'Проектов' },
              { icon: Users, value: '50+', label: 'Клиентов' },
              { icon: Award, value: '10+', label: 'Наград' },
            ].map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <motion.div
                  key={achievement.label}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 h-full">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                    <CardContent className="p-8 text-center relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="mb-6"
                      >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                          <Icon className="w-10 h-10 text-primary" />
                        </div>
                      </motion.div>
                      <div className="text-5xl font-heading font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {achievement.value}
                      </div>
                      <p className="text-muted-foreground text-lg">{achievement.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Clients */}
        <section>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading font-bold text-4xl md:text-5xl mb-12 text-center bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            Наши клиенты
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {[1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.6, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center border border-border/50 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-muted-foreground text-sm">Логотип клиента</span>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
