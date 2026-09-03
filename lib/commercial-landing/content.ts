/**
 * Контент коммерческого лендинга /reklamny-rolik.
 *
 * Страница не хардкодит текст: значения ниже — дефолты, поверх которых
 * ложится JSON из настроек сайта (ключ COMMERCIAL_LANDING_SETTINGS_KEY).
 * Такой подход не требует новой таблицы: settings уже хранит произвольный JSON,
 * а недостающие поля всегда добираются из дефолтов, поэтому неполная или
 * повреждённая запись в CMS не может уронить страницу.
 *
 * Правки цен согласованы со статьёй /blog/skolko-stoit-reklamnyj-rolik —
 * сайт не должен противоречить сам себе.
 */

/** Ключ в таблице settings, под которым лежит контент лендинга */
export const COMMERCIAL_LANDING_SETTINGS_KEY = 'commercial_landing'

/** Путь лендинга — используется в canonical, sitemap и payload заявки */
export const COMMERCIAL_LANDING_PATH = '/reklamny-rolik'

/** Куда ведёт вторичный CTA «сначала поговорить» */
export const BOOKING_PATH = '/booking'

export const TELEGRAM_HANDLE = 'mariseven'
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`
export const CONTACT_EMAIL = 'hello@savagemovie.ru'

/** Статья, в которой бюджет разобран подробно */
export const PRICING_ARTICLE_PATH = '/blog/skolko-stoit-reklamnyj-rolik'

export interface HeroContent {
  eyebrow: string
  geo: string
  h1: string
  lead: string
  budgetQualifier: string
  ctaPrimary: string
  ctaSecondary: string
  /** Подпись под CTA. Обещание срока публикуется только через sla (см. ниже) */
  ctaNote: string
  /** Bunny video id короткого коммерческого лупа. null — показываем постер */
  videoPlaybackId: string | null
  /** Постер для мобильных и для первого кадра до старта видео */
  posterUrl: string | null
}

export interface SlaContent {
  /**
   * Публикуем обещание срока только после того, как SLA принят внутри Savage.
   * До этого момента enabled = false и под CTA стоит нейтральный текст.
   */
  enabled: boolean
  text: string
}

export interface TrustContent {
  title: string
  /**
   * Логотипы берутся из коллекции клиентов CMS. Пока там пусто, блок
   * не рендерится вовсе: выдумывать логотипы нельзя, а пустая полоса
   * доверия не добавляет.
   */
  maxLogos: number
}

export interface CaseContext {
  slug: string
  /** Отраслевая/форматная подпись: «HoReCa / рекламный ролик» */
  kind: string
  /** Третья строка карточки: «Digital · выставки · AI + live action» */
  meta: string
}

export interface CasesContent {
  title: string
  subtitle: string
  /** Абзац перед сеткой: объясняет, на что смотреть в кейсах */
  intro: string
  /** Приоритетные слаги. Недостающие добираются из CMS по категории commercial */
  featuredSlugs: string[]
  /** Сколько карточек показываем на первом экране раздела */
  limit: number
  contexts: CaseContext[]
  ctaLabel: string
  allProjectsLabel: string
}

export interface TaskItem {
  id: string
  title: string
  description: string
  /** Значение, которое подставится в форму сметы как «что нужно сделать» */
  projectType: string
  /** Если задача уже получила собственную intent-страницу — ведём туда */
  href: string | null
}

export interface TasksContent {
  title: string
  subtitle: string
  items: TaskItem[]
}

export interface ShowreelContent {
  title: string
  caption: string
  /** Отдельный коммерческий cut 30–45 сек. null — блок скрыт */
  playbackId: string | null
}

export interface ProcessStep {
  number: string
  title: string
  /** Одно предложение о том, что реально происходит на этапе */
  summary: string
  items: string[]
}

export interface ProcessContent {
  title: string
  subtitle: string
  steps: ProcessStep[]
}

export interface PriceTier {
  id: string
  name: string
  range: string
  /** Что определяет сумму именно в этом диапазоне */
  summary: string
  /** Основной коммерческий сегмент выделяем визуально */
  highlight: boolean
  items: string[]
  note: string | null
}

export interface PricingContent {
  title: string
  subtitle: string
  tiers: PriceTier[]
  /** Что сдвигает смету в любую сторону — до того, как человек спросит */
  footnote: string
  ctaLabel: string
  articleLabel: string
  articleHref: string
}

export interface WhyItem {
  title: string
  description: string
  /** Кейс-доказательство: тезис без доказательства на этой странице не живёт */
  caseSlug: string | null
  caseLabel: string | null
}

export interface WhyContent {
  title: string
  items: WhyItem[]
}

export interface OptionItem {
  value: string
  label: string
}

export interface EstimateContent {
  title: string
  subtitle: string
  step1Title: string
  step2Title: string
  projectTypeLabel: string
  projectTypes: OptionItem[]
  usageLabel: string
  usageOptions: OptionItem[]
  deadlineLabel: string
  deadlineOptions: OptionItem[]
  budgetLabel: string
  budgetOptions: OptionItem[]
  nextLabel: string
  backLabel: string
  submitLabel: string
  bookingHint: string
  bookingLabel: string
}

export interface SuccessContent {
  title: string
  text: string
  telegramLabel: string
  projectsLabel: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqContent {
  title: string
  items: FaqItem[]
}

export interface FinalCtaContent {
  title: string
  text: string
  ctaLabel: string
  /** Кадр или короткий луп для финала. null — сплошной фон */
  playbackId: string | null
  posterUrl: string | null
}

export interface SeoContent {
  title: string
  description: string
  /** Отдельная коммерческая OG-картинка. null — генерируется маршрутом opengraph-image */
  ogImageUrl: string | null
  ogTitle: string
  ogDescription: string
}

export interface CommercialLandingContent {
  hero: HeroContent
  sla: SlaContent
  trust: TrustContent
  cases: CasesContent
  tasks: TasksContent
  showreel: ShowreelContent
  process: ProcessContent
  pricing: PricingContent
  why: WhyContent
  estimate: EstimateContent
  success: SuccessContent
  faq: FaqContent
  finalCta: FinalCtaContent
  seo: SeoContent
}

export const DEFAULT_COMMERCIAL_LANDING: CommercialLandingContent = {
  hero: {
    eyebrow: 'SAVAGE MOVIE / COMMERCIAL PRODUCTION',
    geo: 'Санкт-Петербург · Москва · проекты по России',
    h1: 'Рекламные ролики для бизнеса и брендов',
    lead: 'Креатив, съёмка и постпродакшн под ключ. От задачи и сценария до готовых версий для digital, сайта, соцсетей, ТВ и экранов.',
    budgetQualifier: 'Большинство коммерческих проектов — 300–700 тыс. ₽',
    ctaPrimary: 'Получить предварительную смету',
    ctaSecondary: 'Смотреть проекты',
    ctaNote:
      'Расскажите задачу — предложим формат производства, сроки и ориентир бюджета.',
    videoPlaybackId: null,
    posterUrl: null,
  },

  sla: {
    // Пока SLA не утверждён внутри Savage, обещание «24 часа» не публикуется
    enabled: false,
    text: 'Предварительная оценка — в течение 24 часов.',
  },

  trust: {
    title: 'Работали с',
    maxLogos: 12,
  },

  cases: {
    title: 'Коммерческие проекты',
    subtitle: 'Не showreel. Конкретные задачи брендов.',
    intro:
      'Ниже — работы, снятые под конкретную задачу заказчика: запуск продукта, имиджевая кампания, презентация услуги. У каждой указано, для какой отрасли она сделана и где ролик использовался — так понятнее, насколько похожая задача решаема в вашем случае.',
    featuredSlugs: ['wellery', 'mavin', 'sensual', 'best-western'],
    limit: 4,
    contexts: [
      {
        slug: 'wellery',
        kind: 'HoReCa / рекламный ролик',
        meta: 'Digital · выставки · AI + live action',
      },
      {
        slug: 'mavin',
        kind: 'Fashion / brand campaign',
        meta: 'Москва · commercial',
      },
      {
        slug: 'sensual',
        kind: 'Имиджевая реклама',
        meta: 'Нестандартный art direction',
      },
      {
        slug: 'best-western',
        kind: 'Гостиничный бизнес / рекламный ролик',
        meta: 'Digital · сайт · соцсети',
      },
    ],
    ctaLabel: 'Смотреть кейс',
    allProjectsLabel: 'Все проекты',
  },

  tasks: {
    title: 'Начинаем не с камеры. Начинаем с задачи.',
    subtitle: 'Выберите то, что ближе к вашей ситуации — форма подстроится.',
    items: [
      {
        id: 'launch',
        title: 'Запустить продукт',
        description:
          'Рекламный ролик для digital-кампании, сайта, маркетплейсов и соцсетей.',
        projectType: 'ad',
        href: null,
      },
      {
        id: 'brand',
        title: 'Сделать бренд заметнее',
        description: 'Имиджевый ролик и визуальная история бренда.',
        projectType: 'ad',
        href: null,
      },
      {
        id: 'explain',
        title: 'Объяснить продукт',
        description: 'Продуктовое видео, демонстрация сервиса или технологии.',
        projectType: 'product',
        href: null,
      },
      {
        id: 'company',
        title: 'Представить компанию',
        description: 'Презентационный ролик для клиентов, партнёров и команды.',
        projectType: 'company',
        href: null,
      },
      {
        id: 'exhibition',
        title: 'Подготовиться к выставке',
        description: 'Видео для стенда, презентаций и экранов.',
        projectType: 'exhibition',
        href: null,
      },
      {
        id: 'ai',
        title: 'Сделать то, что камерой не снять',
        description: 'AI, CGI и гибридный production.',
        projectType: 'ai',
        href: null,
      },
    ],
  },

  showreel: {
    title: 'Commercial reel',
    caption: 'Бренды, продукты, HoReCa, fashion, business, AI и live action.',
    playbackId: null,
  },

  process: {
    title: 'От задачи до готового ролика — одной командой',
    subtitle: 'Производство рекламного ролика под ключ: пять этапов, один ответственный.',
    steps: [
      {
        number: '01',
        title: 'Креатив и сценарий',
        summary:
          'Разбираем задачу и продукт, спорим о том, что должно остаться у зрителя после просмотра, и только потом пишем сценарий. Этап заканчивается визуальной концепцией и референсами, по которым уже можно считать смету.',
        items: [
          'изучение задачи',
          'идея',
          'сценарий',
          'визуальная концепция',
          'референсы',
        ],
      },
      {
        number: '02',
        title: 'Препродакшн',
        summary:
          'Самая недооценённая часть производства: здесь собирается команда, ищутся локации, идёт кастинг и утверждается раскадровка. Всё, что не решено до смены, на площадке стоит в разы дороже.',
        items: [
          'смета',
          'команда',
          'кастинг',
          'локации',
          'реквизит',
          'раскадровка',
          'съёмочный план',
        ],
      },
      {
        number: '03',
        title: 'Продакшн',
        summary:
          'Съёмочные смены по утверждённому плану. Режиссёр, оператор, свет и звук работают по раскадровке, а продюсер держит график — чтобы съёмка закончилась в тот день, на который её посчитали.',
        items: [
          'режиссура',
          'операторская работа',
          'свет',
          'звук',
          'production management',
        ],
      },
      {
        number: '04',
        title: 'Постпродакшн',
        summary:
          'Монтаж, цвет и звук собирают отснятое в ролик. Здесь же подключается графика, VFX и, если это уместнее съёмки, AI-генерация отдельных элементов.',
        items: [
          'монтаж',
          'цвет',
          'sound design',
          'графика',
          'VFX',
          'AI/CGI при необходимости',
        ],
      },
      {
        number: '05',
        title: 'Адаптации',
        summary:
          'Из готового материала собираем версии под площадки: горизонталь для сайта и ТВ, вертикаль для соцсетей, квадрат для лент, короткие резки для рекламы. Форматы планируются заранее, потому что от них зависит кадрирование на съёмке.',
        items: [
          '16:9, 9:16, 1:1',
          'сайт',
          'digital',
          'social',
          'экраны',
          'ТВ при необходимости',
        ],
      },
    ],
  },

  pricing: {
    title: 'Сколько стоит рекламный ролик',
    subtitle:
      'Не продаём ролики по тарифу. Но порядок бюджета можно понять до первого созвона.',
    tiers: [
      {
        id: 'compact',
        name: 'Компактный продакшн',
        range: '100–300 тыс. ₽',
        summary:
          'Подходит, когда задача сформулирована, продукт готов к съёмке, а ролик нужен для digital и соцсетей. Экономия здесь идёт за счёт объёма производства, а не за счёт качества картинки, поэтому решает точность идеи.',
        highlight: false,
        items: [
          'одна съёмочная смена',
          'небольшая команда',
          'простая локация',
          'базовый постпродакшн',
        ],
        note: null,
      },
      {
        id: 'core',
        name: 'Основной коммерческий сегмент',
        range: '300–700 тыс. ₽',
        summary:
          'Полноценное производство: сценарий, подготовленная площадка, профессиональная группа и постпродакшн без спешки. В этом диапазоне ролик уже выдерживает сравнение с рекламой федеральных брендов.',
        highlight: true,
        items: [
          'проработанный сценарий',
          'профессиональная команда',
          'полноценный production',
          'расширенный post',
          'версии для площадок',
        ],
        note: 'Большинство коммерческих проектов Savage Movie — в этом диапазоне.',
      },
      {
        id: 'extended',
        name: 'Расширенный продакшн',
        range: 'от 700 тыс. ₽',
        summary:
          'Сюда попадают проекты с несколькими сменами, актёрами, сложной логистикой или графикой. Смета считается индивидуально: слишком многое зависит от концепции, чтобы называть вилку заранее.',
        highlight: false,
        items: [
          'сложная концепция',
          'несколько смен',
          'актёры',
          'сложные локации',
          'CGI/VFX',
          'масштабный production',
        ],
        note: null,
      },
    ],
    footnote:
      'Сильнее всего смету двигают три вещи: количество съёмочных смен, участие актёров и объём графики. Съёмка в другом городе добавляет логистику группы, а сжатые сроки — переработки. Всё это мы считаем до старта и фиксируем в смете, а не сообщаем по ходу проекта.',
    // Тот же ярлык, что у hero.ctaPrimary/estimate.submitLabel/finalCta.ctaLabel —
    // один и тот же CTA-интент должен читаться одинаково в любой точке входа
    ctaLabel: 'Получить предварительную смету',
    articleLabel: 'Подробно разобрали бюджет',
    articleHref: PRICING_ARTICLE_PATH,
  },

  why: {
    title: 'Почему проект стоит делать с Savage',
    items: [
      {
        title: 'Киношный уровень коммерческого контента',
        description:
          'Смотрите кейсы выше: это не рендеры презентации, а ролики, которые вышли в digital и работают на бренды.',
        caseSlug: 'mavin',
        caseLabel: 'MAVIN — Small Joys',
      },
      {
        title: 'Live action + AI в одном production pipeline',
        description:
          'AI у нас не отдельная услуга, а способ получить кадр, который иначе не снять или не оправдать по бюджету.',
        caseSlug: 'biotherm',
        caseLabel: 'Biotherm — Молекула воды',
      },
      {
        title: 'Не ограничиваемся Санкт-Петербургом',
        description: 'Базируемся в Санкт-Петербурге, снимаем в Москве и по России.',
        caseSlug: 'mavin',
        caseLabel: 'Съёмка в Москве',
      },
      {
        title: 'От идеи до адаптаций',
        description:
          'Одна команда отвечает за весь production: не приходится сводить подрядчиков между собой.',
        caseSlug: 'wellery',
        caseLabel: 'WELLERY — Шесть утра',
      },
      {
        title: 'Думаем о площадке до съёмки',
        description:
          'Где ролик будет жить — в digital, на стенде или на экране в зале — решаем до смены, а не на монтаже.',
        caseSlug: null,
        caseLabel: null,
      },
    ],
  },

  estimate: {
    title: 'Получить предварительную смету',
    subtitle:
      'Два коротких шага. После отправки вернёмся с форматом производства, сроками и ориентиром бюджета.',
    step1Title: 'О проекте',
    step2Title: 'Контакт',
    projectTypeLabel: 'Что нужно сделать?',
    projectTypes: [
      { value: 'ad', label: 'Рекламный ролик' },
      { value: 'company', label: 'Видео о компании' },
      { value: 'product', label: 'Продуктовый ролик' },
      { value: 'exhibition', label: 'Видео для выставки' },
      { value: 'ai', label: 'AI / hybrid' },
      { value: 'other', label: 'Другое' },
    ],
    usageLabel: 'Где будет использоваться?',
    usageOptions: [
      { value: 'digital', label: 'Digital-реклама' },
      { value: 'social', label: 'Соцсети' },
      { value: 'site', label: 'Сайт' },
      { value: 'event', label: 'Выставка / мероприятие' },
      { value: 'tv', label: 'ТВ' },
      { value: 'internal', label: 'Внутренние коммуникации' },
      { value: 'unknown', label: 'Пока не знаю' },
    ],
    deadlineLabel: 'Когда нужен результат?',
    deadlineOptions: [
      { value: 'urgent', label: 'Срочно' },
      { value: 'month', label: 'До месяца' },
      { value: '1-2months', label: '1–2 месяца' },
      { value: 'later', label: 'Позже' },
      { value: 'undecided', label: 'Пока не определено' },
    ],
    budgetLabel: 'Ориентир бюджета',
    budgetOptions: [
      { value: 'under-200', label: 'До 200 тыс.' },
      { value: '200-400', label: '200–400 тыс.' },
      { value: '400-700', label: '400–700 тыс.' },
      { value: '700-1500', label: '700 тыс. – 1,5 млн' },
      { value: '1500-plus', label: '1,5 млн+' },
      { value: 'undecided', label: 'Пока не определён' },
    ],
    nextLabel: 'Дальше',
    backLabel: 'Назад',
    submitLabel: 'Получить предварительную смету',
    bookingHint: 'Предпочитаете сначала поговорить?',
    bookingLabel: 'Записаться на короткий созвон',
  },

  success: {
    title: 'Задача получена',
    text: 'Посмотрим вводные и свяжемся с вами, чтобы уточнить детали и сориентировать по формату, срокам и бюджету.',
    telegramLabel: 'Написать в Telegram',
    projectsLabel: 'Посмотреть ещё проекты',
  },

  faq: {
    title: 'Вопросы о создании рекламных роликов',
    items: [
      {
        question: 'Сколько стоит рекламный ролик?',
        answer:
          'Компактный продакшн — 100–300 тыс. ₽, основной коммерческий сегмент — 300–700 тыс. ₽, сложные проекты со съёмочной группой, актёрами и CGI — от 700 тыс. ₽. Большинство наших коммерческих проектов попадает в средний диапазон. Как складывается сумма — разобрали в отдельной статье о бюджете рекламного ролика.',
      },
      {
        question: 'Сколько времени занимает производство?',
        answer:
          'Срок задаёт сложность, а не календарь. Простой ролик с одной сменой и коротким постом реально выпустить за две-три недели. Проект со сценарием, кастингом, несколькими локациями и графикой занимает от полутора месяцев. Мы не обещаем универсальные «три дня»: срок называем после того, как понимаем задачу.',
      },
      {
        question: 'Можно ли начать без готового сценария?',
        answer:
          'Да, и чаще всего так и происходит. Разработка идеи и сценария — часть производства. Достаточно задачи, продукта и понимания, где ролик будет использоваться.',
      },
      {
        question: 'Работаете ли вы в Москве?',
        answer:
          'Да. Savage Movie базируется в Санкт-Петербурге и реализует проекты в Москве и по России. Логистику съёмочной группы закладываем в смету заранее, чтобы бюджет не менялся по ходу проекта.',
      },
      {
        question: 'Можно ли использовать AI?',
        answer:
          'Да, когда он помогает решить задачу лучше или оптимизировать отдельные production-элементы. Мы совмещаем live action и AI в одном пайплайне: часть кадров снимаем, часть генерируем — выбор делаем по результату, а не по моде.',
      },
      {
        question: 'Можно ли сделать несколько форматов из одной съёмки?',
        answer:
          'Да. Версии 16:9, 9:16 и 1:1, короткие резки для соцсетей и вариант для экранов планируются до съёмки: от этого зависят кадрирование, свет и хронометраж. Обсудить это после монтажа уже дороже.',
      },
      {
        question: 'Работаете ли вы с тендерами?',
        answer:
          'Да, участвуем в тендерах и закупках. Пришлите ТЗ и требования к участнику — приложите файл к форме или дайте ссылку, и мы ответим по срокам, смете и комплекту документов.',
      },
      {
        question: 'Можно ли прислать готовый бриф?',
        answer:
          'Да. В форме есть поле для файла и для ссылки: подойдут PDF, документ, презентация или папка с референсами. С готовым брифом предварительная оценка получается точнее.',
      },
    ],
  },

  finalCta: {
    title: 'Есть задача — посчитаем, как её снять',
    text: 'Расскажите, что нужно сделать. Предложим production-подход и сориентируем по бюджету.',
    ctaLabel: 'Получить предварительную смету',
    playbackId: null,
    posterUrl: null,
  },

  seo: {
    title: 'Рекламные ролики для бизнеса под ключ — Savage Movie | Москва и СПб',
    description:
      'Создаём рекламные ролики для брендов и бизнеса: креатив, сценарий, съёмка, постпродакшн, AI и адаптации. Savage Movie — проекты в Москве, Санкт-Петербурге и по России.',
    ogImageUrl: null,
    ogTitle: 'Рекламные ролики — Savage Movie',
    ogDescription:
      'Коммерческий видеопродакшн под ключ: креатив, съёмка, постпродакшн и адаптации. Санкт-Петербург, Москва, проекты по России.',
  },
}
