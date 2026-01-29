/**
 * Секция подписки на newsletter в стиле The Up&Up Group
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Здесь можно добавить интеграцию с API для подписки
      // Пока просто симулируем успешную отправку
      await new Promise(resolve => setTimeout(resolve, 1000))

      setIsSuccess(true)
      setEmail('')

      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Ошибка подписки:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-border/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground">
            Оставайтесь на связи
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-light mb-12 max-w-2xl mx-auto">
            Подпишитесь на нашу рассылку и будьте в курсе новых проектов, кейсов и полезных
            материалов
          </p>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
              <p className="text-lg text-foreground">Спасибо за подписку!</p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
            >
              <Input
                type="email"
                placeholder="Ваш email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 h-14 text-base border-border/50 bg-background rounded-none focus:border-foreground focus:ring-0"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 px-8 bg-foreground hover:bg-foreground/90 text-background rounded-none font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Подписаться'
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
