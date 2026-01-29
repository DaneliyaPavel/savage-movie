/**
 * Интеграция с Resend для отправки email
 */
import { Resend } from 'resend'
import { logger } from '@/lib/utils/logger'

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeSubject(value: string): string {
  return value.replace(/[\r\n]/g, ' ').trim()
}

/**
 * Отправляет email через Resend
 */
export async function sendEmail(options: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY не настроен')
  }

  if (!resend) {
    throw new Error('RESEND_API_KEY не настроен')
  }

  const from = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@savagemovie.ru'

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      throw new Error(`Ошибка отправки email: ${error.message}`)
    }

    return data
  } catch (error) {
    logger.error('Ошибка отправки email', error, {
      function: 'sendEmail',
      recipientCount: Array.isArray(options.to) ? options.to.length : 1,
    })
    throw error
  }
}

/**
 * Отправляет подтверждение бронирования
 */
export async function sendBookingConfirmation(
  email: string,
  serviceType: string,
  date: string,
  time: string
) {
  const serviceNames: Record<string, string> = {
    consultation: 'Консультация',
    shooting: 'Съемка',
    production: 'Продакшн',
    training: 'Обучение',
  }

  const rawServiceName = serviceNames[serviceType] || serviceType
  const safeServiceName = escapeHtml(rawServiceName)
  const safeDate = escapeHtml(date)
  const safeTime = escapeHtml(time)
  const subjectServiceName = sanitizeSubject(rawServiceName)

  return sendEmail({
    to: email,
    subject: `Подтверждение бронирования: ${subjectServiceName}`,
    html: `
      <h1>Ваше бронирование подтверждено</h1>
      <p>Услуга: ${safeServiceName}</p>
      <p>Дата: ${safeDate}</p>
      <p>Время: ${safeTime}</p>
      <p>Мы свяжемся с вами в ближайшее время.</p>
    `,
  })
}

/**
 * Отправляет подтверждение записи на курс
 */
export async function sendCourseEnrollmentConfirmation(
  email: string,
  courseTitle: string
) {
  const safeCourseTitle = escapeHtml(courseTitle)
  const subjectCourseTitle = sanitizeSubject(courseTitle)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    logger.warn('NEXT_PUBLIC_APP_URL not configured for email links', {
      function: 'sendCourseEnrollmentConfirmation',
    })
  }
  const baseUrl = (appUrl || 'http://localhost:3000').replace(/\/$/, '')

  return sendEmail({
    to: email,
    subject: `Добро пожаловать на курс: ${subjectCourseTitle}`,
    html: `
      <h1>Вы успешно записались на курс!</h1>
      <p>Курс: ${safeCourseTitle}</p>
      <p>Теперь вы можете получить доступ к материалам курса в личном кабинете.</p>
      <p><a href="${baseUrl}/dashboard">Перейти в личный кабинет</a></p>
    `,
  })
}

/**
 * Отправляет уведомление администратору о новой заявке
 */
export async function sendContactFormNotification(
  adminEmail: string,
  submission: {
    name: string
    email: string
    phone?: string
    message: string
    budget?: number
  }
) {
  const safeName = escapeHtml(submission.name)
  const safeEmail = escapeHtml(submission.email)
  const safePhone = submission.phone ? escapeHtml(submission.phone) : ''
  const safeMessage = escapeHtml(submission.message)
  const safeBudget =
    typeof submission.budget === 'number' && Number.isFinite(submission.budget)
      ? submission.budget.toLocaleString('ru-RU')
      : null

  return sendEmail({
    to: adminEmail,
    subject: 'Новая заявка с сайта',
    html: `
      <h2>Новая заявка с контактной формы</h2>
      <p><strong>Имя:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      ${submission.phone ? `<p><strong>Телефон:</strong> ${safePhone}</p>` : ''}
      ${safeBudget ? `<p><strong>Бюджет:</strong> ${safeBudget} ₽</p>` : ''}
      <p><strong>Сообщение:</strong></p>
      <p>${safeMessage}</p>
    `,
  })
}
