/**
 * Заявка на созвон.
 *
 * Сознательно без календаря со слотами: продакшн не продаётся временными
 * окнами, а реальная доступность режиссёра на сменах непредсказуема —
 * публичные слоты пришлось бы постоянно переносить. Вместо точного времени
 * спрашиваем грубый интервал, этого хватает, чтобы перезвонить вовремя.
 *
 * Заявка уходит в тот же /api/contact, что и остальные формы сайта.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowRight, CheckCircle2, Loader2, MessageCircle } from 'lucide-react'

import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SvgMark } from '@/components/ui/svg-mark'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useI18n } from '@/lib/i18n-context'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { cn } from '@/lib/utils'

const TELEGRAM_HANDLE = 'mariseven'

/** Ключи совпадают с PROJECT_TYPE_LABELS в /api/contact */
const projectTypes = [
  { value: 'commercial', ru: 'Коммерция', en: 'Commercial' },
  { value: 'musicVideo', ru: 'Клип', en: 'Music video' },
  { value: 'brandFilm', ru: 'Бренд-фильм', en: 'Brand film' },
  { value: 'documentary', ru: 'Документалка', en: 'Documentary' },
  { value: 'ai', ru: 'AI-проект', en: 'AI project' },
  { value: 'course', ru: 'Обучение', en: 'Course' },
  { value: 'other', ru: 'Другое', en: 'Other' },
] as const

const timeWindows = [
  { value: 'today', ru: 'Сегодня', en: 'Today' },
  { value: 'tomorrowAm', ru: 'Завтра до 14:00', en: 'Tomorrow before 2 PM' },
  { value: 'tomorrowPm', ru: 'Завтра после 14:00', en: 'Tomorrow after 2 PM' },
  { value: 'week', ru: 'На этой неделе', en: 'This week' },
  { value: 'any', ru: 'Не важно', en: 'Anytime' },
] as const

/** В заявку всегда пишем русскую подпись — читать её нам, а не клиенту */
const TIME_WINDOW_LABELS_RU: Record<string, string> = Object.fromEntries(
  timeWindows.map(item => [item.value, item.ru])
)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEGRAM_HANDLE_PATTERN = /^[a-zA-Z0-9_]{5,32}$/

type ContactKind = 'phone' | 'telegram' | 'email'

/**
 * Одно поле вместо трёх: человек пишет как ему привычно, а мы сами решаем,
 * что это за канал, и кладём в нужное поле запроса.
 */
function detectContact(raw: string): { kind: ContactKind; value: string } | null {
  const value = raw.trim()
  if (!value) return null

  if (EMAIL_PATTERN.test(value)) {
    return { kind: 'email', value: value.toLowerCase() }
  }

  const handle = value
    .replace(/^https?:\/\//i, '')
    .replace(/^t\.me\//i, '')
    .replace(/^@/, '')

  if (value.startsWith('@') || /^(https?:\/\/)?t\.me\//i.test(value)) {
    return TELEGRAM_HANDLE_PATTERN.test(handle) ? { kind: 'telegram', value: `@${handle}` } : null
  }

  if (/^[\d\s+()-]+$/.test(value)) {
    return value.replace(/\D/g, '').length >= 10 ? { kind: 'phone', value } : null
  }

  return TELEGRAM_HANDLE_PATTERN.test(handle) ? { kind: 'telegram', value: `@${handle}` } : null
}

type FormValues = {
  projectType: string
  name: string
  contact: string
  timeWindow: string
  consent: true
}

export default function BookingPage() {
  const { language } = useI18n()
  const isRu = language === 'ru'

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const formSchema = z.object({
    projectType: z.string().min(1, isRu ? 'Выберите, что снимаем' : 'Pick a project type'),
    name: z.string().min(2, isRu ? 'Минимум 2 символа' : 'At least 2 characters'),
    contact: z
      .string()
      .min(1, isRu ? 'Оставьте контакт для связи' : 'Leave a way to reach you')
      .refine(
        value => detectContact(value) !== null,
        isRu ? 'Телефон, ник в Telegram или email' : 'Phone, Telegram handle or email'
      ),
    timeWindow: z.string(),
    consent: z.literal(true, {
      error: isRu
        ? 'Необходимо дать согласие на обработку персональных данных'
        : 'Consent to personal data processing is required',
    }),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: '',
      name: '',
      contact: '',
      timeWindow: 'any',
      consent: false as unknown as true,
    },
  })

  const onSubmit = async (values: FormValues) => {
    // Двойной клик / повторный submit не должны создать вторую заявку и вторую конверсию
    if (isSubmitting) return

    const contact = detectContact(values.contact)
    if (!contact) return

    setIsSubmitting(true)
    setSubmitError(null)

    const windowLabel = TIME_WINDOW_LABELS_RU[values.timeWindow]

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          phone: contact.kind === 'phone' ? contact.value : undefined,
          telegram: contact.kind === 'telegram' ? contact.value : undefined,
          email: contact.kind === 'email' ? contact.value : undefined,
          projectType: values.projectType,
          message: windowLabel
            ? `Заявка на созвон. Когда удобно: ${windowLabel}`
            : 'Заявка на созвон',
        }),
      })

      if (!response.ok) {
        // Сообщение сервера показываем только на 400 — там это понятная подсказка
        // по полям. Всё остальное (500, недоступный сервис) заменяем общим текстом.
        const data: { error?: string } | null = await response.json().catch(() => null)
        setSubmitError(
          (response.status === 400 && data?.error) ||
            (isRu
              ? 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.'
              : 'Could not send the request. Please try again or message us on Telegram.')
        )
        return
      }

      // Заявка принята и доставлена сервером — только теперь это конверсия
      trackMetrikaGoal('production_lead_success')

      setIsSuccess(true)
      form.reset()
    } catch (error) {
      // Сетевой сбой: текст исключения человеку ничего не говорит, показываем общий
      console.error('Ошибка отправки заявки:', error)
      setSubmitError(
        isRu
          ? 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.'
          : 'Could not send the request. Please try again or message us on Telegram.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepLabel = (index: string, ru: string, en: string) =>
    `${index} — ${isRu ? ru : en}`

  const stepLabelClass = 'block text-xs uppercase tracking-widest text-muted-foreground mb-5'

  const chipClass = (isActive: boolean, accent?: boolean) =>
    cn(
      'h-12 px-5 border text-base transition-colors',
      isActive
        ? accent
          ? 'border-accent text-accent'
          : 'border-foreground bg-foreground text-background'
        : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
    )

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      <section className="pt-32 pb-16 px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            {isRu ? 'Бесплатно, 15–20 минут' : 'Free, 15–20 minutes'}
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-light tracking-tight leading-[0.9] flex items-start gap-4">
            {isRu ? 'Обсудим проект' : 'Let’s talk'}
            <SvgMark type="plus" className="text-accent mt-2" size={32} delay={0.5} />
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-xl mt-8 leading-relaxed"
        >
          {isRu
            ? 'Оставьте контакт — свяжемся и договоримся о созвоне. Расскажем, как решаем задачу, сколько это стоит и в какие сроки.'
            : 'Leave a contact and we will reach out to set up a call — how we solve the task, what it costs, how long it takes.'}
        </motion.p>
      </section>

      <section className="pb-24 px-6 md:px-10 lg:px-20">
        <div className="max-w-3xl">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="border border-border p-8 md:p-12"
            >
              <CheckCircle2 className="w-12 h-12 text-accent mb-6" />
              <h2 className="text-2xl md:text-3xl font-light mb-4">
                {isRu ? 'Заявка принята' : 'Request received'}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                {isRu
                  ? 'Свяжемся в течение рабочего дня. Если нужно быстрее — напишите напрямую, там отвечаем оперативнее всего.'
                  : 'We will get back within a business day. Need it faster? Message us directly — that is the quickest channel.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`https://t.me/${TELEGRAM_HANDLE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {isRu ? 'Написать в Telegram' : 'Message on Telegram'}
                </a>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="inline-flex items-center justify-center h-14 px-8 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  {isRu ? 'Отправить ещё одну' : 'Send another'}
                </button>
              </div>
            </motion.div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={stepLabelClass}>{stepLabel('01', 'Что снимаем', 'What we shoot')}</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-3">
                          {projectTypes.map(type => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => field.onChange(type.value)}
                              aria-pressed={field.value === type.value}
                              className={chipClass(field.value === type.value)}
                            >
                              {isRu ? type.ru : type.en}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage className="mt-3" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={stepLabelClass}>{stepLabel('02', 'Как вас зовут', 'Your name')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isRu ? 'Имя' : 'Name'}
                            autoComplete="name"
                            className="h-14 text-base bg-transparent border-border rounded-none focus-visible:border-foreground focus-visible:ring-0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="mt-3" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={stepLabelClass}>{stepLabel('03', 'Куда написать', 'Where to reach you')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              isRu ? 'Телефон, @ник или email' : 'Phone, @handle or email'
                            }
                            autoComplete="tel"
                            className="h-14 text-base bg-transparent border-border rounded-none focus-visible:border-foreground focus-visible:ring-0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="mt-3" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="timeWindow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={stepLabelClass}>{stepLabel('04', 'Когда удобно созвониться', 'When suits you')}</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-3">
                          {timeWindows.map(slot => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => field.onChange(slot.value)}
                              aria-pressed={field.value === slot.value}
                              className={chipClass(field.value === slot.value, true)}
                            >
                              {isRu ? slot.ru : slot.en}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                            {isRu ? 'Даю ' : 'I consent to '}
                            <Link
                              href="/consent"
                              className="underline hover:text-foreground transition-colors"
                            >
                              {isRu
                                ? 'согласие на обработку персональных данных'
                                : 'personal data processing'}
                            </Link>
                            {isRu ? ' в соответствии с ' : ' under the '}
                            <Link
                              href="/privacy"
                              className="underline hover:text-foreground transition-colors"
                            >
                              {isRu ? 'Политикой обработки ПД' : 'Privacy Policy'}
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {submitError && (
                    <p role="alert" className="text-sm text-accent">
                      {submitError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-14 px-10 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {isRu ? 'Отправляем' : 'Sending'}
                        </>
                      ) : (
                        <>
                          {isRu ? 'Записаться на созвон' : 'Book a call'}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <a
                      href={`https://t.me/${TELEGRAM_HANDLE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isRu ? 'или сразу в Telegram' : 'or message on Telegram'}
                    </a>
                  </div>
                </div>
              </form>
            </Form>
          )}

          <p className="mt-16 pt-8 border-t border-border text-sm text-muted-foreground">
            {isRu ? 'Нужна подробная смета? Заполните ' : 'Need a detailed quote? Fill in the '}
            <Link href="/contact" className="underline hover:text-foreground transition-colors">
              {isRu ? 'развёрнутый бриф' : 'full brief'}
            </Link>
            {isRu
              ? ' — с бюджетом, сроками и описанием задачи.'
              : ' — budget, timeline and task description.'}
          </p>
        </div>
      </section>
    </main>
  )
}
