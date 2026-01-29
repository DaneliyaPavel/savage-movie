/**
 * Премиум форма контактов с бюджет слайдером в стиле Freshman.tv
 * Сохраняет логику, но визуально переделана в премиум стиле
 */
'use client'

import { useState } from 'react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSlider } from '@/components/ui/premium-slider'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { HoverNote } from '@/components/ui/hover-note'

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email адрес'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Сообщение должно содержать минимум 10 символов'),
  budget: z.array(z.number()).length(1),
})

type FormValues = z.infer<typeof formSchema>

interface ContactFormProps {
  className?: string
}

export function ContactForm({ className = '' }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      budget: [50000],
    },
  })

  const budgetValue = form.watch('budget')?.[0] || 50000

  // Motion value и spring для плавной анимации numeric readout
  const budgetMotionValue = useMotionValue(budgetValue)
  const budgetSpring = useSpring(budgetMotionValue, {
    damping: 25,
    stiffness: 300,
    mass: 0.5,
  })

  // Обновляем motion value при изменении budget
  React.useEffect(() => {
    budgetMotionValue.set(budgetValue)
  }, [budgetValue, budgetMotionValue])

  // Для отображения используем текущее значение из формы (будет анимироваться через spring)
  const [displayBudget, setDisplayBudget] = React.useState(budgetValue)

  React.useEffect(() => {
    const unsubscribe = budgetSpring.on('change', latest => {
      setDisplayBudget(Math.round(latest))
    })
    return () => unsubscribe()
  }, [budgetSpring])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          budget: values.budget[0],
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка отправки формы')
      }

      setIsSuccess(true)
      form.reset()

      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (error) {
      // В клиентских компонентах оставляем console для отладки в браузере
      console.error('Ошибка отправки формы:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className={`relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-[#1A1A1A] bg-[#000000] ${className}`}
    >
      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl mb-6 text-[#FFFFFF]">
            Оставить заявку
          </h2>
          <p className="text-lg md:text-xl text-[#FFFFFF]/60 font-light max-w-2xl mx-auto">
            Заполните форму, и мы свяжемся с вами в ближайшее время
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-heading font-bold mb-3 text-[#FFFFFF]">
                Спасибо за заявку!
              </h3>
              <p className="text-lg text-[#FFFFFF]/60">Мы свяжемся с вами в ближайшее время</p>
            </motion.div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium mb-3 text-[#FFFFFF]/80">
                            Ваше имя
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Иван Иванов"
                              className="h-14 text-base border-[#1A1A1A] bg-[#050505] text-[#FFFFFF] placeholder:text-[#FFFFFF]/40 focus:border-[#FFFFFF] focus:ring-0 rounded-none transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FFFFFF]/60" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium mb-3 text-[#FFFFFF]/80">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="ivan@example.com"
                              className="h-14 text-base border-[#1A1A1A] bg-[#050505] text-[#FFFFFF] placeholder:text-[#FFFFFF]/40 focus:border-[#FFFFFF] focus:ring-0 rounded-none transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FFFFFF]/60" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium mb-3 text-[#FFFFFF]/80">
                          Телефон{' '}
                          <span className="text-[#FFFFFF]/40 font-normal">(необязательно)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+7 (999) 999-99-99"
                            className="h-14 text-base border-[#1A1A1A] bg-[#050505] text-[#FFFFFF] placeholder:text-[#FFFFFF]/40 focus:border-[#FFFFFF] focus:ring-0 rounded-none transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[#FFFFFF]/60" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium mb-3 text-[#FFFFFF]/80">
                          Сообщение
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Расскажите о вашем проекте..."
                            className="min-h-[160px] text-base border-[#1A1A1A] bg-[#050505] text-[#FFFFFF] placeholder:text-[#FFFFFF]/40 focus:border-[#FFFFFF] focus:ring-0 rounded-none transition-all resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[#FFFFFF]/60" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Премиум бюджет слайдер */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6 md:space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <HoverNote text="budget" position="top">
                            <FormLabel className="text-base md:text-lg font-medium text-[#FFFFFF]/80 cursor-help">
                              Бюджет проекта
                            </FormLabel>
                          </HoverNote>
                          {/* Крупный numeric readout с плавной анимацией */}
                          <motion.div
                            className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-[#ff2936] tabular-nums"
                            key={displayBudget}
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 0.2 }}
                          >
                            {displayBudget.toLocaleString('ru-RU')} ₽
                          </motion.div>
                        </div>
                        <FormControl>
                          <HoverNote text="scope" position="top" className="w-full">
                            <PremiumSlider
                              min={10000}
                              max={1000000}
                              step={10000}
                              value={field.value}
                              onValueChange={field.onChange}
                              className="w-full"
                            />
                          </HoverNote>
                        </FormControl>
                        <div className="flex justify-between text-sm text-[#FFFFFF]/40 mt-4">
                          <span>10 000 ₽</span>
                          <span>1 000 000 ₽</span>
                        </div>
                        <FormMessage className="text-[#FFFFFF]/60" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 md:h-16 text-lg md:text-xl font-medium bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 text-[#000000] rounded-none transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        Отправить заявку
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
