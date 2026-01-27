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
    logger.error('Ошибка отправки email', error, { function: 'sendEmail', to: options.to })
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

  const serviceName = serviceNames[serviceType] || serviceType

  return sendEmail({
    to: email,
    subject: `Подтверждение бронирования: ${serviceName}`,
    html: `
      <h1>Ваше бронирование подтверждено</h1>
      <p>Услуга: ${serviceName}</p>
      <p>Дата: ${date}</p>
      <p>Время: ${time}</p>
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
  return sendEmail({
    to: email,
    subject: `Добро пожаловать на курс: ${courseTitle}`,
    html: `
      <h1>Вы успешно записались на курс!</h1>
      <p>Курс: ${courseTitle}</p>
      <p>Теперь вы можете получить доступ к материалам курса в личном кабинете.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Перейти в личный кабинет</a></p>
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
  return sendEmail({
    to: adminEmail,
    subject: 'Новая заявка с сайта',
    html: `
      <h2>Новая заявка с контактной формы</h2>
      <p><strong>Имя:</strong> ${submission.name}</p>
      <p><strong>Email:</strong> ${submission.email}</p>
      ${submission.phone ? `<p><strong>Телефон:</strong> ${submission.phone}</p>` : ''}
      ${submission.budget ? `<p><strong>Бюджет:</strong> ${submission.budget.toLocaleString('ru-RU')} ₽</p>` : ''}
      <p><strong>Сообщение:</strong></p>
      <p>${submission.message}</p>
    `,
  })
}
