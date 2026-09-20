/**
 * Контент брифа раздела направлений.
 *
 * Бриф на /services — та же форма, что собирает заявки на коммерческом
 * лендинге: два шага, одно поле контакта, вложение брифа, атрибуция и одна
 * конверсия. Дублировать её ради другого набора вопросов нельзя — вся
 * проверенная логика доставки и защиты от ботов живёт там.
 *
 * Отличается ровно одно: первый вопрос. На /reklamny-rolik спрашивают формат
 * ролика, здесь — направление производства, потому что именно направление
 * человек уже выбрал, нажав CTA в своей сцене. Значения совпадают с
 * ServiceDirectionId, поэтому сервер выводит из ответа service_direction
 * без дополнительного поля в форме.
 *
 * Площадки, сроки и бюджет переиспользуются как есть: воронки направлений и
 * воронка рекламного лендинга должны сравниваться между собой.
 */
import {
  DEFAULT_COMMERCIAL_LANDING,
  BUDGET_OPTIONS,
  type EstimateContent,
  type SuccessContent,
} from '@/lib/commercial-landing/content'
import { SERVICE_DIRECTIONS } from './directions'

const commercialEstimate = DEFAULT_COMMERCIAL_LANDING.estimate

export const SERVICES_BRIEF: EstimateContent = {
  title: 'Расскажите задачу',
  subtitle:
    'Два коротких шага. После отправки вернёмся с форматом производства, сроками и ориентиром бюджета.',
  step1Title: 'О задаче',
  step2Title: 'Контакт',
  projectTypeLabel: 'Какое направление ближе?',
  // Значение = ServiceDirectionId: ответ на этот вопрос и есть направление
  projectTypes: SERVICE_DIRECTIONS.map(direction => ({
    value: direction.id,
    label: direction.title,
  })),
  usageLabel: commercialEstimate.usageLabel,
  usageOptions: [...commercialEstimate.usageOptions],
  deadlineLabel: commercialEstimate.deadlineLabel,
  deadlineOptions: [...commercialEstimate.deadlineOptions],
  budgetLabel: commercialEstimate.budgetLabel,
  budgetOptions: [...BUDGET_OPTIONS],
  nextLabel: commercialEstimate.nextLabel,
  backLabel: commercialEstimate.backLabel,
  submitLabel: 'Обсудить проект',
  bookingHint: commercialEstimate.bookingHint,
  bookingLabel: commercialEstimate.bookingLabel,
}

export const SERVICES_BRIEF_SUCCESS: SuccessContent = {
  title: 'Задача получена',
  text: 'Посмотрим вводные и свяжемся с вами, чтобы уточнить детали и сориентировать по формату, срокам и бюджету.',
  telegramLabel: DEFAULT_COMMERCIAL_LANDING.success.telegramLabel,
  projectsLabel: DEFAULT_COMMERCIAL_LANDING.success.projectsLabel,
}
