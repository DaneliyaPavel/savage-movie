/**
 * Кадры сцен направлений.
 *
 * Это НЕ кадры из портфолио. Раньше сцены направлений собирались из
 * галерей работ: это скриншоты видео в разном качестве, часть с вшитыми
 * логотипами брендов (см. комментарии в frames.ts). Здесь лежат отобранные
 * иллюстрации направлений: ИИ-генерации (файлы hf_…, выгрузка Higgsfield)
 * из общей папки студии на Яндекс.Диске, пересобранные в webp под сайт
 * (public/scenes).
 *
 * Правила, которые из этого следуют:
 *  - у кадра сцены нет клиента, проекта и ссылки на кейс; подписи вида
 *    «Кадр — {клиент}» и «Кадр из портфолио» на них не печатаются (см.
 *    isCredited в pages/resolve.ts);
 *  - кадры сцены нельзя выдавать за съёмку конкретного заказчика: карточки
 *    работ, титры, лента кейсов и списки работ по-прежнему берут настоящие
 *    кадры проектов;
 *  - кадры не должны содержать читаемых логотипов и чужих торговых марок.
 *
 * Порядок в DIRECTION_SCENES — порядок назначения мест на странице направления
 * (какой кадр куда, описано у самой страницы). Один и тот же кадр может стоять
 * в нескольких направлениях, но первый экран у каждой страницы свой.
 */
import type { ServiceDirectionId } from './directions'
import type { SceneFrame } from './pages/resolve'

export interface SceneStill {
  src: string
  w: number
  h: number
  /** object-position под композицию кадра: где в нём лицо или предмет */
  position: string
  tone: 'dark' | 'mid' | 'light'
}

const STILLS = {
  // Бордовое платье, каменный зал, диагональ света
  'burgundy-hall': {
    src: '/scenes/burgundy-hall.2ed109d5.webp',
    w: 1792,
    h: 2400,
    position: '62% 45%',
    tone: 'dark',
  },
  // Рыжая модель, низкий ключ, каменный корсет
  'redhead-lowkey': {
    src: '/scenes/redhead-lowkey.8a5a415e.webp',
    w: 1536,
    h: 2048,
    position: '52% 28%',
    tone: 'mid',
  },
  // Модель с лебедем на потёртой стене
  'swan-wall': {
    src: '/scenes/swan-wall.4591fff3.webp',
    w: 1792,
    h: 2400,
    position: '52% 28%',
    tone: 'mid',
  },
  // Модель с лебедем, красная стена, вертикаль
  'swan-red-wall': {
    src: '/scenes/swan-red-wall.2ec26565.webp',
    w: 1792,
    h: 2400,
    position: '52% 35%',
    tone: 'mid',
  },
  // Рыжая модель в корсете-листе, сине-серый фон
  'redhead-leaf': {
    src: '/scenes/redhead-leaf.94f8d7cf.webp',
    w: 1536,
    h: 2048,
    position: '52% 14%',
    tone: 'mid',
  },
  // Модель с лебедем, раскрытое крыло
  'swan-wing': {
    src: '/scenes/swan-wing.077da51d.webp',
    w: 1792,
    h: 2400,
    position: '52% 28%',
    tone: 'mid',
  },
  // Брюнетка в белом жакете в коридоре
  'white-suit-hall': {
    src: '/scenes/white-suit-hall.927cbab9.webp',
    w: 1920,
    h: 1080,
    position: '47% 20%',
    tone: 'mid',
  },
  // Крупный план в шлеме, пустыня, вертикаль
  helmet: {
    src: '/scenes/helmet.2fad2ba9.webp',
    w: 1792,
    h: 2400,
    position: '55% 35%',
    tone: 'light',
  },
  // Модель с лебедем в накидке, вертикаль
  'swan-cape': {
    src: '/scenes/swan-cape.67ce0076.webp',
    w: 1792,
    h: 2400,
    position: '55% 22%',
    tone: 'mid',
  },
  // Модель в мотокуртке у белого купе
  'moto-desert': {
    src: '/scenes/moto-desert.90480e38.webp',
    w: 1792,
    h: 2400,
    position: '50% 30%',
    tone: 'light',
  },
  // Портрет за рулём купе, вертикаль
  'coupe-portrait': {
    src: '/scenes/coupe-portrait.ac227427.webp',
    w: 1792,
    h: 2400,
    position: '55% 42%',
    tone: 'mid',
  },
  // Женщина в кремовом жакете в холле
  'cream-jacket-hall': {
    src: '/scenes/cream-jacket-hall.3afd55b2.webp',
    w: 1920,
    h: 1080,
    position: '48% 30%',
    tone: 'mid',
  },
  // Женщина с пучком в профиль, тёмный интерьер
  'white-suit-profile': {
    src: '/scenes/white-suit-profile.cba2a161.webp',
    w: 1920,
    h: 1080,
    position: '48% 27%',
    tone: 'dark',
  },
  // Мужчина в костюме у бетонной колонны
  'brutalist-man': {
    src: '/scenes/brutalist-man.5ee6a7b5.webp',
    w: 2048,
    h: 1152,
    position: '62% 28%',
    tone: 'dark',
  },
  // Человек с сумкой под бетонной аркой
  'concrete-bag': {
    src: '/scenes/concrete-bag.dc75a86a.webp',
    w: 1920,
    h: 1075,
    position: '45% 48%',
    tone: 'mid',
  },
  // Женщина в блейзере у окна закусочной
  'window-blazer': {
    src: '/scenes/window-blazer.d38a575a.webp',
    w: 1920,
    h: 1080,
    position: '52% 34%',
    tone: 'mid',
  },
  // Одинокая фигура на огромной лестнице
  'stairs-figure': {
    src: '/scenes/stairs-figure.2b8b0283.webp',
    w: 1920,
    h: 1080,
    position: '61% 38%',
    tone: 'mid',
  },
  // Женщина в блейзере у окна, парный кадр
  'window-blazer-b': {
    src: '/scenes/window-blazer-b.641c4c9d.webp',
    w: 1920,
    h: 1080,
    position: '45% 37%',
    tone: 'mid',
  },
  // Женщина в кремовом жакете, симметричный холл
  'cream-jacket-lobby': {
    src: '/scenes/cream-jacket-lobby.acbcee8e.webp',
    w: 1920,
    h: 1080,
    position: '46% 22%',
    tone: 'mid',
  },
  // Рыжеволосая женщина в белом жакете
  'white-suit-green': {
    src: '/scenes/white-suit-green.91069a15.webp',
    w: 1920,
    h: 1080,
    position: '49% 19%',
    tone: 'mid',
  },
  // Маленькая фигура на бетонной лестнице
  'stairs-slopes': {
    src: '/scenes/stairs-slopes.fc865e03.webp',
    w: 1920,
    h: 1080,
    position: '43% 42%',
    tone: 'mid',
  },
  // Чёрно-белая дорога, вариант 2
  'bw-road-b': {
    src: '/scenes/bw-road-b.87cdfa12.webp',
    w: 1920,
    h: 1080,
    position: '30% 55%',
    tone: 'mid',
  },
  // Чёрно-белая дорога, вариант 3
  'bw-road-c': {
    src: '/scenes/bw-road-c.13f723c4.webp',
    w: 1920,
    h: 1080,
    position: '28% 50%',
    tone: 'mid',
  },
  // Чёрно-белая дорога, ведущая линия
  'bw-road': {
    src: '/scenes/bw-road.4119ecbf.webp',
    w: 2048,
    h: 1152,
    position: '40% 50%',
    tone: 'mid',
  },
  // Двое в кожаных костюмах в пустом кинозале
  'cinema-suits': {
    src: '/scenes/cinema-suits.4bacd8ba.webp',
    w: 1920,
    h: 1080,
    position: '52% 35%',
    tone: 'mid',
  },
  // Сумерки, купе с включёнными фарами
  'dusk-car': {
    src: '/scenes/dusk-car.546ba2e2.webp',
    w: 1920,
    h: 1072,
    position: '49% 30%',
    tone: 'dark',
  },
  // За рулём купе на закате, широкий кадр
  'coupe-sunset': {
    src: '/scenes/coupe-sunset.1a84842e.webp',
    w: 1920,
    h: 1072,
    position: '64% 37%',
    tone: 'mid',
  },
  // Девушка в тренче выходит из стеклянной двери ночью
  'trench-night': {
    src: '/scenes/trench-night.5a06a911.webp',
    w: 1920,
    h: 1088,
    position: '42% 30%',
    tone: 'dark',
  },
  // Модель в шлеме, широкий кадр
  'helmet-wide': {
    src: '/scenes/helmet-wide.e590ca43.webp',
    w: 1920,
    h: 1072,
    position: '56% 47%',
    tone: 'light',
  },
  // Модель у белого купе на дороге
  'desert-road-car': {
    src: '/scenes/desert-road-car.dc424872.webp',
    w: 1920,
    h: 1072,
    position: '40% 25%',
    tone: 'mid',
  },
  // Портрет в авиаторах за рулём купе
  'coupe-aviators': {
    src: '/scenes/coupe-aviators.c9798c8b.webp',
    w: 2400,
    h: 1340,
    position: '52% 47%',
    tone: 'mid',
  },
  // Модель с лебедем в зале, широкий кадр
  'swan-hall': {
    src: '/scenes/swan-hall.4931c394.webp',
    w: 2048,
    h: 1152,
    position: '51% 26%',
    tone: 'mid',
  },
  // Модель с лебедем в накидке, широкий кадр
  'swan-cape-wide': {
    src: '/scenes/swan-cape-wide.f37cd4e5.webp',
    w: 1920,
    h: 1072,
    position: '45% 25%',
    tone: 'mid',
  },
  // Модель с лебедем, красная стена, широкий кадр
  'swan-red-wall-wide': {
    src: '/scenes/swan-red-wall-wide.eb934fe7.webp',
    w: 1920,
    h: 1072,
    position: '52% 30%',
    tone: 'mid',
  },
  // Модель в кремовом платье обнимает лебедя, зал
  'swan-embrace': {
    src: '/scenes/swan-embrace.054598a3.webp',
    w: 1920,
    h: 1080,
    position: '50% 20%',
    tone: 'dark',
  },
  // Модель с лебедем под рукой, красная стена, крупнее
  'swan-red-wall-close': {
    src: '/scenes/swan-red-wall-close.42e6b084.webp',
    w: 1792,
    h: 2400,
    position: '55% 25%',
    tone: 'mid',
  },
  // Блондинка за рулём купе, профиль, золотой свет
  'desert-drive': {
    src: '/scenes/desert-drive.4f7b8f25.webp',
    w: 1792,
    h: 2400,
    position: '40% 38%',
    tone: 'mid',
  },
  // Рыжая модель в кожаном корсете, пустыня, синее небо
  'redhead-dunes': {
    src: '/scenes/redhead-dunes.b1c5db6d.webp',
    w: 1536,
    h: 2048,
    position: '50% 22%',
    tone: 'mid',
  },
  // Бьюти, фронтальный портрет, мокрые волосы
  'beauty-front': {
    src: '/scenes/beauty-front.fb43bb17.webp',
    w: 1728,
    h: 2304,
    position: '50% 40%',
    tone: 'mid',
  },
  // Бьюти, наклон головы, глянцевые губы
  'beauty-tilt': {
    src: '/scenes/beauty-tilt.cdb4f385.webp',
    w: 1536,
    h: 2048,
    position: '45% 48%',
    tone: 'mid',
  },
  // Макро: губы с глянцем, мокрые пряди
  'beauty-lips': {
    src: '/scenes/beauty-lips.2d019e2a.webp',
    w: 1792,
    h: 2400,
    position: '33% 48%',
    tone: 'mid',
  },
  // Бьюти с веснушками, мокрые пряди
  'beauty-freckles': {
    src: '/scenes/beauty-freckles.adb6aedd.webp',
    w: 1792,
    h: 2400,
    position: '45% 45%',
    tone: 'mid',
  },
  // Бьюти, глянцевые веки, тёплая кожа
  'beauty-gloss': {
    src: '/scenes/beauty-gloss.4eadd304.webp',
    w: 1536,
    h: 2048,
    position: '58% 45%',
    tone: 'mid',
  },
  // Бьюти, блондинка, светлые пряди
  'beauty-blonde': {
    src: '/scenes/beauty-blonde.4b7c1ceb.webp',
    w: 1536,
    h: 2048,
    position: '40% 52%',
    tone: 'mid',
  },
  // Макро: закрытые глаза, брови и капли воды на коже
  'skin-eyes-wide': {
    src: '/scenes/skin-eyes-wide.5328f7f9.webp',
    w: 2400,
    h: 1352,
    position: '50% 45%',
    tone: 'dark',
  },
  // Макро: щека, нос, ухо и капли воды
  'skin-cheek-wide': {
    src: '/scenes/skin-cheek-wide.3bc8825d.webp',
    w: 2400,
    h: 1275,
    position: '40% 50%',
    tone: 'dark',
  },
  // Макро: губы и капли воды на подбородке
  'skin-lips-wide': {
    src: '/scenes/skin-lips-wide.7b6f1bbb.webp',
    w: 1831,
    h: 1034,
    position: '50% 40%',
    tone: 'dark',
  },
  // Бьюти: мокрая кожа, закрытые глаза, руки у висков
  'skin-closed-portrait': {
    src: '/scenes/skin-closed-portrait.d41f6111.webp',
    w: 1792,
    h: 1921,
    position: '50% 35%',
    tone: 'dark',
  },
  // Бьюти: мокрая кожа, лицо в полуоборот, капли воды
  'skin-profile-portrait': {
    src: '/scenes/skin-profile-portrait.32d440b9.webp',
    w: 1792,
    h: 1921,
    position: '45% 40%',
    tone: 'dark',
  },
} as const satisfies Record<string, SceneStill>

export type SceneStillId = keyof typeof STILLS

export const SCENE_STILLS: Record<SceneStillId, SceneStill> = STILLS

export const DIRECTION_SCENES: Record<ServiceDirectionId, readonly SceneStillId[]> = {
  commercial: [],
  fashion: [
    'burgundy-hall',
    'swan-wall',
    'redhead-lowkey',
    'swan-red-wall',
    'helmet',
    'redhead-leaf',
    'swan-cape',
    'redhead-dunes',
    'moto-desert',
    'desert-drive',
    'swan-wing',
    'swan-red-wall-close',
    'brutalist-man',
    'cream-jacket-lobby',
  ],
  beauty: [
    'skin-cheek-wide',
    'skin-profile-portrait',
    'beauty-lips',
    'beauty-freckles',
    'beauty-gloss',
    'beauty-blonde',
    'beauty-tilt',
    'skin-lips-wide',
    'skin-closed-portrait',
    'skin-eyes-wide',
    'beauty-front',
  ],
  'content-production': [
    'coupe-aviators',
    'desert-road-car',
    'bw-road',
    'burgundy-hall',
    'helmet',
    'window-blazer',
    'coupe-portrait',
    'concrete-bag',
    'stairs-figure',
    'cream-jacket-lobby',
    'dusk-car',
  ],
  corporate: [
    'brutalist-man',
    'concrete-bag',
    'window-blazer',
    'stairs-figure',
    'window-blazer-b',
    'cream-jacket-lobby',
    'white-suit-green',
    'stairs-slopes',
    'white-suit-hall',
    'cinema-suits',
    'cream-jacket-hall',
    'white-suit-profile',
    'bw-road-c',
    'bw-road-b',
  ],
  ai: [
    'swan-hall',
    'swan-red-wall',
    'swan-cape-wide',
    'swan-red-wall-wide',
    'skin-eyes-wide',
    'swan-embrace',
    'swan-cape',
    'redhead-lowkey',
    'burgundy-hall',
    'redhead-leaf',
    'swan-wing',
    'helmet',
    'redhead-dunes',
  ],
  music: [
    'dusk-car',
    'brutalist-man',
    'white-suit-hall',
    'trench-night',
    'bw-road',
    'cream-jacket-lobby',
    'cinema-suits',
    'concrete-bag',
    'burgundy-hall',
    'stairs-slopes',
    'helmet-wide',
    'coupe-sunset',
  ],
}

/** Кадр сцены в форме, которую понимают страницы: без клиента, проекта и названия */
export function sceneFrame(id: SceneStillId): SceneFrame {
  const still = SCENE_STILLS[id]
  return {
    key: `scene-${id}`,
    src: still.src,
    slug: '',
    client: '',
    title: '',
    position: still.position,
  }
}

/** Кадры сцены направления в порядке назначения; limit обрезает хвост */
export function sceneFramesFor(id: ServiceDirectionId, limit?: number): SceneFrame[] {
  const ids = DIRECTION_SCENES[id]
  return (limit === undefined ? ids : ids.slice(0, limit)).map(sceneFrame)
}
