/**
 * Коммерческие направления Savage Movie.
 *
 * Единственный источник правды о том, какие production-территории существуют,
 * как они называются в форме, в CRM и в целях Метрики, какими работами
 * доказываются и куда ведут.
 *
 * Здесь НЕТ композиции. Сознательно: /fashion-video и /beauty-video получат
 * собственный art direction, и если бы этот модуль описывал ещё и раскладку,
 * все будущие лендинги родились бы одним шаблоном с подменой заголовка.
 * Модуль отвечает на вопросы «что это за направление» и «чем доказывается»,
 * а как оно выглядит — решает конкретная сцена или конкретная страница.
 *
 * route.published — публикуемость собственного маршрута. Пока false, ссылки
 * на path в разметке не появляется вовсе: пустой индексируемый лендинг хуже,
 * чем его отсутствие. CTA такого направления открывает бриф с предвыбранным
 * направлением, и заявка всё равно приходит размеченной.
 */

/** Идентификатор направления. Он же значение service_direction в заявке и в целях */
export type ServiceDirectionId =
  | 'commercial'
  | 'fashion'
  | 'beauty'
  | 'content-production'
  | 'corporate'
  | 'ai'
  | 'music'

export interface ServiceDirectionRoute {
  /** Собственный маршрут направления — текущий или запланированный */
  path: string
  /**
   * Существует ли страница. false — ссылки нет нигде: ни в CTA, ни в
   * sitemap, ни в JSON-LD. Sprint 2 переключает флаг вместе с публикацией.
   */
  published: boolean
}

export interface ServiceDirection {
  id: ServiceDirectionId
  /** Порядковый номер в монтаже /services: 01…07 */
  index: string
  /** Латинская метка направления — техническая, не заголовок */
  label: string
  /** Человеческое имя для формы, хлебных крошек и schema.org */
  title: string
  route: ServiceDirectionRoute
  /** Правая техническая строка сцены: сегмент и ориентир либо доказательства */
  meta: string
  /** Подпись CTA направления */
  ctaLabel: string
  /**
   * Слаги работ-доказательств в порядке приоритета. Реальность слагов
   * проверяется по загруженному портфолио — выдуманный кейс не должен
   * превратиться в битую ссылку.
   */
  proofSlugs: string[]
  /** Одно предложение для JSON-LD Service и для брифа */
  description: string
}

/**
 * Порядок здесь — это порядок монтажа страницы. Он не случайный: сначала
 * самое денежное и самое понятное поисковому трафику направление, дальше
 * визуально сильные fashion и beauty, в середине — регулярный контент
 * (главная бизнес-идея), и только потом corporate, AI и музыка.
 */
export const SERVICE_DIRECTIONS: readonly ServiceDirection[] = [
  {
    id: 'commercial',
    index: '01',
    label: 'COMMERCIAL',
    title: 'Рекламный production',
    route: { path: '/reklamny-rolik', published: true },
    meta: 'COMMERCIAL / 350–700 ТЫС. ₽+',
    ctaLabel: 'Рекламный production',
    proofSlugs: ['wellery', 'ohtapark', 'best-western', 'diesel'],
    description: 'Рекламные ролики для запуска продукта, кампании, retail, digital и экранов.',
  },
  {
    id: 'fashion',
    index: '02',
    label: 'FASHION',
    title: 'Fashion production',
    route: { path: '/fashion-video', published: false },
    meta: 'ZARINA / MAVIN / SENSUAL / NAUMI',
    ctaLabel: 'Fashion production',
    proofSlugs: ['zarina', 'mavin', 'sensual', 'naumi'],
    description: 'Campaign films, launches, drops и контент для fashion-брендов.',
  },
  {
    id: 'beauty',
    index: '03',
    label: 'BEAUTY',
    title: 'Beauty и product production',
    route: { path: '/beauty-video', published: false },
    meta: 'BIOTHERM / UNNA / YADAH / VERNEL',
    ctaLabel: 'Beauty production',
    proofSlugs: ['unna', 'yadah', 'vernel', 'biotherm'],
    description: 'Beauty и product video, где фактура ощущается почти физически.',
  },
  {
    id: 'content-production',
    index: '04',
    label: 'CONTENT',
    title: 'Регулярный production',
    route: { path: '/content-production', published: false },
    meta: 'QUARTERLY / ОТ 900 ТЫС. ₽',
    ctaLabel: 'Регулярный production',
    proofSlugs: ['wellery', 'zarina', 'cherry'],
    description:
      'Система контента, спланированная до съёмки: campaign film, vertical, website, social и retail.',
  },
  {
    id: 'corporate',
    index: '05',
    label: 'CORPORATE',
    title: 'Корпоративный production',
    route: { path: '/corporate-video', published: false },
    meta: 'WELLERY / СОВКОМБАНК / BEST WESTERN',
    ctaLabel: 'Corporate production',
    proofSlugs: ['sovkombank', 'wellery', 'best-western'],
    description:
      'Brand films, employer video, производство, люди, технологии и события — без постановочных рукопожатий.',
  },
  {
    id: 'ai',
    index: '06',
    label: 'AI',
    title: 'AI и hybrid production',
    route: { path: '/ai-video', published: false },
    meta: 'AI / HYBRID PRODUCTION',
    ctaLabel: 'AI production',
    proofSlugs: ['biotherm', 'wellery'],
    description:
      'Генерация, live action и постпродакшн в одном pipeline — AI там, где он делает идею возможной.',
  },
  {
    id: 'music',
    index: '07',
    label: 'MUSIC',
    title: 'Музыкальные клипы',
    route: { path: '/music-video', published: false },
    meta: 'SOLDATOV / DRALO / СОВКОМБАНК',
    ctaLabel: 'Music video',
    proofSlugs: ['t9-soldatov', 'dralo', 'sovkombank'],
    description: 'Режиссура и production музыкальных клипов.',
  },
] as const

/** Маршрут раздела. Используется в canonical, sitemap, хлебных крошках и атрибуции */
export const SERVICES_PATH = '/services'

/**
 * Якорь брифа на /services — единая точка приземления всех направлений.
 *
 * Совпадает с id формы на коммерческом лендинге сознательно: это одна и та же
 * форма, и адрес у неё должен быть один и тот же на всём сайте.
 */
export const SERVICES_BRIEF_ANCHOR = 'estimate'

const BY_ID = new Map(SERVICE_DIRECTIONS.map(direction => [direction.id, direction]))

export function getServiceDirection(id: string): ServiceDirection | undefined {
  return BY_ID.get(id as ServiceDirectionId)
}

/** Все допустимые значения service_direction — для валидации заявки на сервере */
export const SERVICE_DIRECTION_IDS: readonly string[] = SERVICE_DIRECTIONS.map(
  direction => direction.id
)

/**
 * Куда ведёт CTA направления.
 *
 * Опубликованное направление уводит на собственную страницу. Остальные
 * остаются на /services и открывают бриф: это честная ссылка на существующий
 * контент, а не заглушка и не битый маршрут.
 */
export function directionHref(direction: ServiceDirection): string {
  return direction.route.published
    ? direction.route.path
    : `${SERVICES_PATH}#${SERVICES_BRIEF_ANCHOR}`
}
