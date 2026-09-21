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
    title: 'Рекламные ролики',
    route: { path: '/reklamny-rolik', published: true },
    meta: 'COMMERCIAL / 350–700 ТЫС. ₽+',
    ctaLabel: 'Как мы снимаем рекламу',
    proofSlugs: ['wellery', 'ohtapark', 'best-western', 'diesel'],
    description:
      'Рекламный ролик под запуск продукта или кампанию: идея, сценарий, съёмка и версии под ТВ, digital и экраны.',
  },
  {
    id: 'fashion',
    index: '02',
    label: 'FASHION',
    title: 'Fashion-видео',
    route: { path: '/fashion-video', published: false },
    meta: 'ZARINA / MAVIN / SENSUAL / NAUMI',
    ctaLabel: 'Обсудить съёмку коллекции',
    proofSlugs: ['zarina', 'mavin', 'sensual', 'naumi'],
    description:
      'Fashion video для коллекций и запусков: фильм к кампании, лукбук в движении, ролики к дропу.',
  },
  {
    id: 'beauty',
    index: '03',
    label: 'BEAUTY',
    title: 'Beauty и предметная съёмка',
    route: { path: '/beauty-video', published: false },
    meta: 'BIOTHERM / UNNA / YADAH / VERNEL',
    ctaLabel: 'Обсудить beauty-съёмку',
    proofSlugs: ['unna', 'yadah', 'vernel', 'biotherm'],
    description:
      'Beauty video и предметная съёмка: кожа, текстура, вода и блеск крупным планом — так, чтобы продукт хотелось взять в руки.',
  },
  {
    id: 'content-production',
    index: '04',
    label: 'CONTENT',
    title: 'Регулярный продакшн',
    route: { path: '/content-production', published: false },
    meta: 'НА КВАРТАЛ / ОТ 900 ТЫС. ₽',
    ctaLabel: 'Спланировать съёмки',
    proofSlugs: ['wellery', 'zarina', 'cherry'],
    description:
      'Одна продуманная съёмка — материалы на квартал: главный ролик, вертикальные версии, видео для сайта, соцсетей и магазинов.',
  },
  {
    id: 'corporate',
    index: '05',
    label: 'CORPORATE',
    title: 'Корпоративное видео',
    route: { path: '/corporate-video', published: false },
    meta: 'WELLERY / СОВКОМБАНК / BEST WESTERN',
    ctaLabel: 'Обсудить фильм о компании',
    proofSlugs: ['sovkombank', 'wellery', 'best-western'],
    description:
      'Корпоративные фильмы о производстве, технологиях и людях компании — для клиентов, партнёров и будущих сотрудников.',
  },
  {
    id: 'ai',
    index: '06',
    label: 'AI',
    title: 'AI-видео',
    route: { path: '/ai-video', published: false },
    meta: 'AI + LIVE ACTION',
    ctaLabel: 'Обсудить AI-проект',
    proofSlugs: ['biotherm', 'wellery'],
    description:
      'AI video и гибридный продакшн: живая съёмка, генерация и постпродакшн в одной работе — без пластиковой картинки.',
  },
  {
    id: 'music',
    index: '07',
    label: 'MUSIC',
    title: 'Музыкальные клипы',
    route: { path: '/music-video', published: false },
    meta: 'SOLDATOV / DRALO / СОВКОМБАНК',
    ctaLabel: 'Обсудить клип',
    proofSlugs: ['t9-soldatov', 'dralo', 'sovkombank'],
    description: 'Музыкальные клипы: режиссура, образ артиста и монтаж, который держится за трек.',
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
