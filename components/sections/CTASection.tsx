/**
 * CTA секция с контактной формой
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
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
import { motion } from 'framer-motion'
import { logger } from '@/lib/utils/logger'

const formSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email адрес'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Сообщение должно содержать минимум 10 символов'),
  budget: z.array(z.number()).length(1),
})

type FormValues = z.infer<typeof formSchema>

export function CTASection() {
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

      // Сброс успешного сообщения через 5 секунд
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (error) {
      logger.error('Ошибка отправки формы', error, { component: 'CTASection' })
      // Здесь можно добавить toast уведомление об ошибке
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-border/30">
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground"
          >
            Готовы создать проект?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto"
          >
            Заполните форму, и мы свяжемся с вами в ближайшее время
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="border border-border/30 bg-background">
            <div className="p-8 md:p-12">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-primary mb-6" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-heading font-bold mb-3"
                  >
                    Спасибо за заявку!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-lg"
                  >
                    Мы свяжемся с вами в ближайшее время
                  </motion.p>
                </motion.div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium mb-2">Ваше имя</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Иван Иванов"
                                  className="h-14 text-base border-border/50 bg-background/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium mb-2">Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="ivan@example.com"
                                  className="h-14 text-base border-border/50 bg-background focus:border-foreground focus:ring-0 rounded-none transition-all"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium mb-2">
                              Телефон{' '}
                              <span className="text-muted-foreground font-normal">
                                (необязательно)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+7 (999) 999-99-99"
                                className="h-14 text-base border-border/50 bg-background focus:border-foreground focus:ring-0 rounded-none transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium mb-2">Сообщение</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Расскажите о вашем проекте..."
                                className="min-h-[160px] text-base border-border/50 bg-background focus:border-foreground focus:ring-0 rounded-none transition-all resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium mb-4 flex items-center justify-between">
                              <span>Бюджет проекта</span>
                              <span className="text-2xl font-heading font-bold text-primary">
                                {(field.value?.[0] ?? 0).toLocaleString('ru-RU')} ₽
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={10000}
                                max={1000000}
                                step={10000}
                                value={field.value}
                                onValueChange={field.onChange}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                              <span>10 000 ₽</span>
                              <span>1 000 000 ₽</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-14 text-lg font-medium bg-foreground hover:bg-foreground/90 text-background rounded-none transition-all"
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
                              transition={{ duration: 1.5, repeat: Infinity }}
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
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
