'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type Language = 'ru' | 'en'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.projects': 'Проекты',
    'nav.studio': 'О нас',
    'nav.courses': 'Обучение',
    'nav.contact': 'Контакты',
    'nav.blog': 'Блог',
    'nav.menu': 'Меню',
    'nav.close': 'Закрыть',
    'nav.openMenu': 'Открыть меню',
    'nav.closeMenu': 'Закрыть меню',

    // Home
    'home.nowPlaying': 'Сейчас играет',
    'home.directedBy': 'Режиссёр',
    'home.scroll': 'Скролл',
    'home.heroSubtitle': 'Продакшн-студия, создающая сильные истории для брендов и артистов.',
    'home.noFeaturedProjects': 'Нет избранных проектов для отображения в карусели',

    // Projects
    'projects.label': 'Избранные работы',
    'projects.title': 'Проекты',
    'projects.viewFull': 'Смотреть полностью',
    'projects.director': 'Режиссёр',
    'projects.year': 'Год',
    'projects.client': 'Клиент',
    'projects.role': 'Роль',
    'projects.explore': 'исследовать',
    'projects.watch': 'смотреть',
    'projects.about': 'О проекте',
    'projects.credits': 'Команда',
    'projects.related': 'Похожие работы',

    // Studio
    'studio.label': 'О нас',
    'studio.title.line1': 'Мы создаём',
    'studio.title.line2': 'визуальные истории',
    'studio.description':
      'Savage — продакшн-студия, создающая премиальный видеоконтент, AI-проекты и обучающие программы для брендов, артистов и визионеров, которые требуют совершенства.',
    'studio.correction.wrong': 'Видеопродакшн компания',
    'studio.correction.right': 'визуальные сторителлеры',
    'studio.services': 'Что мы делаем',
    'studio.service1.title': 'Коммерческое производство',
    'studio.service1.desc':
      'Полный цикл продакшна для брендов, ищущих премиальный визуальный контент.',
    'studio.service2.title': 'Музыкальные видео',
    'studio.service2.desc': 'Награждённое режиссирование и производство музыкальных клипов.',
    'studio.service3.title': 'Документальное кино',
    'studio.service3.desc': 'Захватывающий сторителлинг через документальные фильмы.',
    'studio.service4.title': 'AI-контент',
    'studio.service4.desc': 'Инновационные проекты с использованием искусственного интеллекта.',
    'studio.team': 'Наша команда',
    'studio.viewReel': 'смотреть рил',
    'studio.testimonials': 'Отзывы',
    'studio.testimonial1':
      'Работа с Savage подняла наш бренд-фильм на уровень, о котором мы даже не мечтали.',
    'studio.testimonial2':
      'Они привносят кинематографическую чувствительность, которая редко встречается в коммерческом продакшне.',
    'studio.cta': 'Готовы творить?',
    'studio.startProject': 'Начать проект',

    // Courses
    'courses.label': 'Обучение',
    'courses.title': 'Курсы',
    'courses.subtitle':
      'Передаём опыт создания премиального контента. От съёмки до AI — учитесь у практиков.',
    'courses.ai.title': 'AI в видеопроизводстве',
    'courses.ai.desc':
      'Используйте искусственный интеллект для создания контента нового поколения. Генерация визуальных концепций, автоматизация рутины, AI-инструменты для пост-продакшна.',
    'courses.filming.title': 'Операторское мастерство',
    'courses.filming.desc':
      'Профессиональная съёмка от основ до продвинутых техник. Работа со светом, движение камеры, композиция кадра.',
    'courses.editing.title': 'Монтаж и пост-продакшн',
    'courses.editing.desc':
      'Искусство монтажа, цветокоррекция, звуковой дизайн. Превращайте отснятый материал в захватывающие истории.',
    'courses.producing.title': 'Продюсирование',
    'courses.producing.desc':
      'Подготовка к съёмке, ведение проекта, работа с клиентом. Всё о том, как организовать процесс от идеи до финального продукта.',
    'courses.duration': 'Длительность',
    'courses.level': 'Уровень',
    'courses.students': 'Студентов',
    'courses.weeks': 'недель',
    'courses.beginner': 'Начинающий',
    'courses.intermediate': 'Средний',
    'courses.advanced': 'Продвинутый',
    'courses.all': 'Все уровни',
    'courses.enroll': 'Записаться',
    'courses.learnMore': 'Подробнее',
    'courses.program': 'Программа курса',
    'courses.mentors': 'Менторы',
    'courses.format': 'Формат',
    'courses.online': 'Онлайн + живые сессии',
    'courses.certificate': 'Сертификат',
    'courses.yes': 'Да',
    'courses.whatYouLearn': 'Чему вы научитесь',
    'courses.forWhom': 'Для кого этот курс',
    'courses.loading': 'Загрузка курсов...',
    'courses.loadError': 'Ошибка загрузки курсов',

    // Contact
    'contact.label': 'Связаться',
    'contact.title': 'Контакт',
    'contact.subtitle':
      'Давайте обсудим ваше видение. Расскажите о проекте, и мы свяжемся с вами в течение 24 часов.',
    'contact.name': 'Имя',
    'contact.namePlaceholder': 'Ваше имя',
    'contact.email': 'Email',
    'contact.emailPlaceholder': 'ваш@email.com',
    'contact.company': 'Компания (опционально)',
    'contact.companyPlaceholder': 'Ваша компания',
    'contact.projectType': 'Тип проекта',
    'contact.type.commercial': 'Коммерция',
    'contact.type.musicVideo': 'Клип',
    'contact.type.documentary': 'Документалка',
    'contact.type.brandFilm': 'Бренд-фильм',
    'contact.type.fashion': 'Fashion',
    'contact.type.ai': 'AI-проект',
    'contact.type.course': 'Обучение',
    'contact.type.other': 'Другое',
    'contact.budget': 'Примерный бюджет',
    'contact.message': 'Расскажите о вашем проекте',
    'contact.messagePlaceholder': 'Опишите ваше видение, сроки и любые специфические требования...',
    'contact.submit': 'Отправить запрос',
    'contact.sendIt': 'отправить',
    'contact.emailLabel': 'Email',
    'contact.location': 'Локация',
    'contact.social': 'Соцсети',
    'contact.select': 'выбрать',

    // Footer
    'footer.rights': 'Все права защищены.',
    'footer.location': 'Москва / Весь мир',

    // Common
    'common.viewAll': 'Смотреть все',
    'common.learnMore': 'Подробнее',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.studio': 'About',
    'nav.courses': 'Courses',
    'nav.contact': 'Contact',
    'nav.blog': 'Blog',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',

    // Home
    'home.nowPlaying': 'Now Playing',
    'home.directedBy': 'Directed by',
    'home.scroll': 'Scroll',
    'home.heroSubtitle': 'A production studio creating high-impact stories for brands and artists.',
    'home.noFeaturedProjects': 'No featured projects to display in carousel',

    // Projects
    'projects.label': 'Selected Works',
    'projects.title': 'Projects',
    'projects.viewFull': 'View Full Project',
    'projects.director': 'Director',
    'projects.year': 'Year',
    'projects.client': 'Client',
    'projects.role': 'Role',
    'projects.explore': 'explore',
    'projects.watch': 'watch',
    'projects.about': 'About',
    'projects.credits': 'Credits',
    'projects.related': 'Related Works',

    // Studio
    'studio.label': 'About Us',
    'studio.title.line1': 'We craft',
    'studio.title.line2': 'visual stories',
    'studio.description':
      'Savage is a visual production company creating premium video content, AI projects and educational programs for brands, artists, and visionaries who demand excellence.',
    'studio.correction.wrong': 'Video production company',
    'studio.correction.right': 'visual storytellers',
    'studio.services': 'What We Do',
    'studio.service1.title': 'Commercial Production',
    'studio.service1.desc': 'Full-service production for brands seeking premium visual content.',
    'studio.service2.title': 'Music Videos',
    'studio.service2.desc': 'Award-winning music video direction and production.',
    'studio.service3.title': 'Documentary',
    'studio.service3.desc': 'Compelling storytelling through documentary filmmaking.',
    'studio.service4.title': 'AI Content',
    'studio.service4.desc': 'Innovative projects using artificial intelligence.',
    'studio.team': 'Our Team',
    'studio.viewReel': 'view reel',
    'studio.testimonials': 'Kind Words',
    'studio.testimonial1':
      'Working with Savage elevated our brand film beyond anything we imagined.',
    'studio.testimonial2':
      "They bring a cinematic sensibility that's rare in commercial production.",
    'studio.cta': 'Ready to create?',
    'studio.startProject': 'Start a project',

    // Courses
    'courses.label': 'Education',
    'courses.title': 'Courses',
    'courses.subtitle':
      'We share our expertise in creating premium content. From filming to AI — learn from practitioners.',
    'courses.ai.title': 'AI in Video Production',
    'courses.ai.desc':
      'Use artificial intelligence to create next-generation content. Visual concept generation, workflow automation, AI tools for post-production.',
    'courses.filming.title': 'Cinematography',
    'courses.filming.desc':
      'Professional filming from basics to advanced techniques. Working with light, camera movement, frame composition.',
    'courses.editing.title': 'Editing & Post-Production',
    'courses.editing.desc':
      'The art of editing, color correction, sound design. Transform raw footage into captivating stories.',
    'courses.producing.title': 'Producing',
    'courses.producing.desc':
      'Pre-production, project management, client relations. Everything about organizing the process from idea to final product.',
    'courses.duration': 'Duration',
    'courses.level': 'Level',
    'courses.students': 'Students',
    'courses.weeks': 'weeks',
    'courses.beginner': 'Beginner',
    'courses.intermediate': 'Intermediate',
    'courses.advanced': 'Advanced',
    'courses.all': 'All levels',
    'courses.enroll': 'Enroll',
    'courses.learnMore': 'Learn More',
    'courses.program': 'Course Program',
    'courses.mentors': 'Mentors',
    'courses.format': 'Format',
    'courses.online': 'Online + Live Sessions',
    'courses.certificate': 'Certificate',
    'courses.yes': 'Yes',
    'courses.whatYouLearn': "What You'll Learn",
    'courses.forWhom': 'Who This Course Is For',
    'courses.loading': 'Loading courses...',
    'courses.loadError': 'Failed to load courses',

    // Contact
    'contact.label': 'Get in Touch',
    'contact.title': 'Contact',
    'contact.subtitle':
      "Let's discuss your vision. Tell us about your project and we'll get back to you within 24 hours.",
    'contact.name': 'Name',
    'contact.namePlaceholder': 'Your name',
    'contact.email': 'Email',
    'contact.emailPlaceholder': 'your@email.com',
    'contact.company': 'Company (Optional)',
    'contact.companyPlaceholder': 'Your company',
    'contact.projectType': 'Project Type',
    'contact.type.commercial': 'Commercial',
    'contact.type.musicVideo': 'Music Video',
    'contact.type.documentary': 'Documentary',
    'contact.type.brandFilm': 'Brand Film',
    'contact.type.fashion': 'Fashion',
    'contact.type.ai': 'AI Project',
    'contact.type.course': 'Education',
    'contact.type.other': 'Other',
    'contact.budget': 'Estimated Budget',
    'contact.message': 'Tell Us About Your Project',
    'contact.messagePlaceholder':
      'Describe your vision, timeline, and any specific requirements...',
    'contact.submit': 'Submit Request',
    'contact.sendIt': 'send it',
    'contact.emailLabel': 'Email',
    'contact.location': 'Location',
    'contact.social': 'Social',
    'contact.select': 'select',

    // Footer
    'footer.rights': 'All rights reserved.',
    'footer.location': 'Moscow / Worldwide',

    // Common
    'common.viewAll': 'View All',
    'common.learnMore': 'Learn More',
  },
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru')

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
