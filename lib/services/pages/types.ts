/**
 * Страницы направлений: общие типы.
 *
 * Здесь описано только то, что одинаково у всех шести страниц и нужно поиску
 * и форме: метаданные, вопросы, этапы, соседние направления. Композиция не
 * описывается намеренно — у каждой страницы своя сцена (см. комментарий в
 * directions.ts): общий шаблон с подменой заголовка поиск читает как дубль,
 * а человек — как каталог.
 */
import type { ServiceDirectionId } from '../directions'

export interface DirectionSeo {
  /** <title>: запрос + что за страница + география; до ~65 знаков */
  title: string
  description: string
  /** Необязательные ключевые фразы: поисковики их не читают, но тест страхует намерение */
  keywords: string[]
  /** Название услуги для schema.org Service */
  serviceName: string
  serviceType: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface ProcessStep {
  number: string
  title: string
  text: string
}

export interface DirectionPageBase {
  id: ServiceDirectionId
  seo: DirectionSeo
  /** Кому страница адресована: одна строка для хлебных крошек и рассылок */
  audience: string
  faq: FaqItem[]
  process: ProcessStep[]
  /** Подпись главной кнопки на странице */
  ctaLabel: string
  /** Подпись кнопки внутри sticky-полосы на телефоне */
  stickyLabel: string
}
