/**
 * Форма предварительной сметы — главная конверсия лендинга.
 *
 * Два шага, а не один длинный экран: на первом человек отвечает про проект
 * (это ему интересно и ни к чему не обязывает), на втором оставляет контакт.
 * Обратный порядок заметно хуже конвертирует на холодном поисковом трафике.
 *
 * Контакт — одно поле «телефон, Telegram или email»: заставлять оставлять
 * именно телефон значит терять часть заявок, а тип связи мы и так определим.
 *
 * Конверсия production_lead_success уходит ровно один раз и только после
 * ответа сервера: аналитика не должна считать заявкой то, что не доставлено.
 */
'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, Paperclip, X } from 'lucide-react'

import {
  BOOKING_PATH,
  TELEGRAM_URL,
  type EstimateContent,
  type SuccessContent,
} from '@/lib/commercial-landing/content'
import { buildAttributionFields } from '@/lib/analytics/attribution'
import { getMetrikaClientId, trackMetrikaGoal } from '@/lib/analytics/metrika'
import { uploadBrief } from '@/lib/api/upload'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'

interface EstimateFormProps {
  content: EstimateContent
  success: SuccessContent
  /** Тип проекта, выбранный в блоке задач: форма открывается уже заполненной */
  presetProjectType: string | null
  onBookingClick: () => void
}

/** Что бэкенд принимает как бриф — держим синхронно с ALLOWED_BRIEF_TYPES */
const ACCEPTED_BRIEF = '.pdf,.doc,.docx,.pptx,.zip,.png,.jpg,.jpeg,.webp'
const MAX_BRIEF_BYTES = 10 * 1024 * 1024

const chipClassName =
  'rounded-sm border px-4 py-2.5 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const fieldClassName =
  'w-full border-b border-white/20 bg-transparent py-3 text-base text-white transition-colors placeholder:text-white/25 focus:border-accent focus:outline-none'

const labelClassName =
  'mb-4 block font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 md:text-xs'

export function EstimateForm({
  content,
  success,
  presetProjectType,
  onBookingClick,
}: EstimateFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [projectType, setProjectType] = useState<string | null>(presetProjectType)
  const [usage, setUsage] = useState<string[]>([])
  const [deadline, setDeadline] = useState<string | null>(null)
  const [budgetRange, setBudgetRange] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [briefUrl, setBriefUrl] = useState('')
  const [comment, setComment] = useState('')
  const [consent, setConsent] = useState(false)
  /** Honeypot: поле спрятано от людей, боты заполняют его охотно */
  const [website, setWebsite] = useState('')

  const [briefFileName, setBriefFileName] = useState<string | null>(null)
  const [uploadedBriefUrl, setUploadedBriefUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startedAtRef = useRef<number | null>(null)
  const formStartTrackedRef = useRef(false)
  const briefTrackedRef = useRef(false)
  const step1TrackedRef = useRef(false)
  const step2HeadingRef = useRef<HTMLHeadingElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Пришли из блока задач — тип уже выбран, форму считаем начатой
  useEffect(() => {
    if (!presetProjectType) return
    setProjectType(presetProjectType)
    markFormStarted()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetProjectType])

  const markFormStarted = useCallback(() => {
    if (formStartTrackedRef.current) return
    formStartTrackedRef.current = true
    startedAtRef.current = Date.now()
    trackMetrikaGoal('estimate_form_start')
  }, [])

  const handleProjectType = (value: string) => {
    markFormStarted()
    setProjectType(value)
    trackMetrikaGoal('estimate_project_type', { project_type: value })
  }

  const handleUsage = (value: string) => {
    markFormStarted()
    setUsage(current =>
      current.includes(value) ? current.filter(item => item !== value) : [...current, value]
    )
  }

  const handleBudget = (value: string) => {
    markFormStarted()
    setBudgetRange(value)
    trackMetrikaGoal('estimate_budget_select', { budget_range: value })
  }

  const goToStep2 = () => {
    markFormStarted()
    setStep(2)
  }

  useEffect(() => {
    if (step !== 2) return

    // Переводим фокус на заголовок шага: без этого пользователь с клавиатуры
    // остаётся на кнопке «Дальше», которой на экране уже нет
    step2HeadingRef.current?.focus()

    // Цель шлём из эффекта, а не из обработчика кнопки: React батчит
    // изменения состояния, и обработчик видел бы значения до последних кликов —
    // в Метрику уходило бы «не выбрано» при выбранных типе и бюджете.
    // Латч нужен, потому что пользователь может вернуться на первый шаг и снова
    // нажать «Дальше», а второй раз шаг уже не «завершён».
    if (step1TrackedRef.current) return
    step1TrackedRef.current = true
    trackMetrikaGoal('estimate_step1_complete', {
      project_type: projectType ?? 'not_selected',
      budget_range: budgetRange ?? 'not_selected',
    })
  }, [step, projectType, budgetRange])

  const trackBriefAttach = () => {
    if (briefTrackedRef.current) return
    briefTrackedRef.current = true
    trackMetrikaGoal('estimate_brief_attach')
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (file.size > MAX_BRIEF_BYTES) {
      setUploadError('Файл больше 10 МБ — пришлите ссылку на облако')
      event.target.value = ''
      return
    }

    setIsUploading(true)
    try {
      const response = await uploadBrief(file)
      setUploadedBriefUrl(response.url)
      setBriefFileName(file.name)
      trackBriefAttach()
    } catch (uploadFailure) {
      logger.error('Не удалось загрузить бриф', uploadFailure)
      setUploadError('Не получилось загрузить файл. Пришлите ссылку — или отправьте так.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const clearBrief = () => {
    setUploadedBriefUrl(null)
    setBriefFileName(null)
    setUploadError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    // Повторный submit (двойной клик, Enter в поле) не создаёт вторую заявку
    if (isSubmitting || isSubmitted) return

    if (name.trim().length < 2) {
      setError('Укажите, как к вам обращаться')
      return
    }
    if (!contact.trim()) {
      setError('Оставьте телефон, Telegram или email — по нему и ответим')
      return
    }
    if (!consent) {
      setError('Нужно согласие на обработку персональных данных')
      return
    }

    setError(null)
    setIsSubmitting(true)

    // ClientID нужен, чтобы связать заявку с визитом в отчётах Метрики.
    // Метрика может быть заблокирована — тогда просто уходит null.
    const clientId = await getMetrikaClientId()

    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim() || null,
          contact: contact.trim(),
          projectType,
          usage,
          deadline,
          budgetRange,
          comment: comment.trim() || null,
          briefUrl: uploadedBriefUrl
            ? new URL(uploadedBriefUrl, window.location.origin).toString()
            : briefUrl.trim() || null,
          consent: true,
          website,
          elapsedMs: startedAtRef.current ? Date.now() - startedAtRef.current : 0,
          clientId,
          attribution: buildAttributionFields(),
          landingPath: window.location.pathname,
          referrer: document.referrer || null,
        }),
      })

      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}))
        setError(data.error || 'Не удалось отправить заявку. Напишите нам в Telegram.')
        return
      }

      // Сервер подтвердил доставку — только теперь это конверсия
      trackMetrikaGoal('production_lead_success')
      setIsSubmitted(true)
    } catch (submitFailure) {
      logger.error('Не удалось отправить заявку на смету', submitFailure)
      setError('Не удалось отправить заявку. Напишите нам в Telegram.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <section
        id="estimate"
        className="scroll-mt-24 border-t border-[#1A1A1A] bg-[#000000] px-6 py-24 md:px-10 md:py-32 lg:px-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent/60">
            <Check className="h-4 w-4 text-accent" />
          </span>
          <h2 className="mt-8 text-3xl font-light tracking-tight text-white md:text-5xl">
            {success.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60 md:text-lg">{success.text}</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMetrikaGoal('telegram_click', { location: 'estimate_success' })}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-white px-7 py-3.5 text-base font-medium text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {success.telegramLabel}
            </a>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 px-7 py-3.5 text-base text-white/80 transition-colors hover:border-white/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {success.projectsLabel}
            </Link>
          </div>
        </motion.div>
      </section>
    )
  }

  return (
    <section
      id="estimate"
      className="scroll-mt-24 border-t border-[#1A1A1A] bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light leading-tight tracking-tight text-white md:text-5xl">
          {content.title}
        </h2>
        <p className="mt-4 text-base text-white/50 md:text-lg">{content.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-12 max-w-3xl md:mt-16" noValidate>
        {/* Honeypot: скрыт от людей и от скринридеров, доступен ботам */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="estimate-website">Не заполняйте это поле</label>
          <input
            id="estimate-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={event => setWebsite(event.target.value)}
          />
        </div>

        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/30">
          {step === 1 ? `01 / ${content.step1Title}` : `02 / ${content.step2Title}`}
        </p>

        {/*
          Шаги переключаются сразу, без ожидания анимации ухода: AnimatePresence
          с mode="wait" держал бы поля второго шага ещё около полусекунды после
          нажатия «Дальше» — на главном пути к заявке это лишняя задержка,
          а на фоновой вкладке (где rAF заморожен) переход и вовсе подвисал бы.
        */}
        <div>
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 space-y-12"
            >
              <fieldset onFocus={markFormStarted}>
                <legend className={labelClassName}>{content.projectTypeLabel}</legend>
                <div className="flex flex-wrap gap-3">
                  {content.projectTypes.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={projectType === option.value}
                      onClick={() => handleProjectType(option.value)}
                      className={cn(
                        chipClassName,
                        projectType === option.value
                          ? 'border-accent bg-accent/10 text-white'
                          : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className={labelClassName}>{content.usageLabel}</legend>
                <div className="flex flex-wrap gap-3">
                  {content.usageOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={usage.includes(option.value)}
                      onClick={() => handleUsage(option.value)}
                      className={cn(
                        chipClassName,
                        usage.includes(option.value)
                          ? 'border-accent bg-accent/10 text-white'
                          : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className={labelClassName}>{content.deadlineLabel}</legend>
                <div className="flex flex-wrap gap-3">
                  {content.deadlineOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={deadline === option.value}
                      onClick={() => {
                        markFormStarted()
                        setDeadline(option.value)
                      }}
                      className={cn(
                        chipClassName,
                        deadline === option.value
                          ? 'border-accent bg-accent/10 text-white'
                          : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className={labelClassName}>{content.budgetLabel}</legend>
                <div className="flex flex-wrap gap-3">
                  {content.budgetOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={budgetRange === option.value}
                      onClick={() => handleBudget(option.value)}
                      className={cn(
                        chipClassName,
                        budgetRange === option.value
                          ? 'border-accent bg-accent/10 text-white'
                          : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={goToStep2}
                className="group inline-flex items-center gap-3 rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {content.nextLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <h3
                ref={step2HeadingRef}
                tabIndex={-1}
                className="text-2xl font-light tracking-tight text-white outline-none md:text-3xl"
              >
                {content.step2Title}
              </h3>

              <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label htmlFor="estimate-company" className={labelClassName}>
                    Компания
                  </label>
                  <input
                    id="estimate-company"
                    type="text"
                    autoComplete="organization"
                    value={company}
                    onChange={event => setCompany(event.target.value)}
                    placeholder="Необязательно"
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="estimate-name" className={labelClassName}>
                    Имя
                  </label>
                  <input
                    id="estimate-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Как к вам обращаться"
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className="mt-8">
                <label htmlFor="estimate-contact" className={labelClassName}>
                  Куда написать
                </label>
                <input
                  id="estimate-contact"
                  type="text"
                  required
                  value={contact}
                  onChange={event => setContact(event.target.value)}
                  placeholder="Телефон, Telegram или email"
                  className={fieldClassName}
                />
              </div>

              <div className="mt-8">
                <label htmlFor="estimate-brief-url" className={labelClassName}>
                  Бриф или референсы
                </label>

                <input
                  id="estimate-brief-url"
                  type="url"
                  inputMode="url"
                  value={briefUrl}
                  onChange={event => {
                    setBriefUrl(event.target.value)
                    if (event.target.value.trim()) trackBriefAttach()
                  }}
                  placeholder="Ссылка на бриф, ТЗ или папку с референсами"
                  className={fieldClassName}
                  disabled={Boolean(uploadedBriefUrl)}
                />

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <input
                    ref={fileInputRef}
                    id="estimate-brief-file"
                    type="file"
                    accept={ACCEPTED_BRIEF}
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="estimate-brief-file"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/40 hover:text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                    {isUploading ? 'Загружаем…' : 'Прикрепить файл'}
                  </label>

                  {briefFileName ? (
                    <span className="inline-flex items-center gap-2 text-sm text-white/70">
                      {briefFileName}
                      <button
                        type="button"
                        onClick={clearBrief}
                        aria-label="Убрать файл"
                        className="text-white/40 transition-colors hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ) : (
                    <span className="text-sm text-white/30">PDF, DOC, PPTX, ZIP или картинка, до 10 МБ</span>
                  )}
                </div>

                {uploadError ? (
                  <p role="alert" className="mt-3 text-sm text-destructive-foreground">
                    {uploadError}
                  </p>
                ) : null}
              </div>

              <div className="mt-8">
                <label htmlFor="estimate-comment" className={labelClassName}>
                  Что ещё важно знать?
                </label>
                <textarea
                  id="estimate-comment"
                  rows={4}
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                  placeholder="Продукт, аудитория, дедлайн, ограничения — всё, что поможет оценить точнее"
                  className={cn(fieldClassName, 'resize-none')}
                />
              </div>

              <label className="mt-10 flex cursor-pointer items-start gap-3 text-sm text-white/50">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={event => setConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[oklch(0.59_0.24_25)]"
                />
                <span>
                  Согласен на обработку персональных данных и принимаю{' '}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-white">
                    политику конфиденциальности
                  </Link>
                </span>
              </label>

              {error ? (
                <p role="alert" className="mt-6 text-sm text-destructive-foreground">
                  {error}
                </p>
              ) : null}

              <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <span className="relative z-10 inline-flex items-center gap-3">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Отправляем…' : content.submitLabel}
                  </span>
                  {!isSubmitting ? (
                    <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {content.backLabel}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </form>

      <p className="mt-12 max-w-3xl text-sm text-white/40">
        {content.bookingHint}{' '}
        <Link
          href={BOOKING_PATH}
          onClick={onBookingClick}
          className="text-white/70 underline underline-offset-4 transition-colors hover:text-accent"
        >
          {content.bookingLabel}
        </Link>
      </p>
    </section>
  )
}
