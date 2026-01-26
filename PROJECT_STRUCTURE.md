# Структура проекта и технологический стек

## Обзор проекта

**Savage Movie** — веб-приложение для видеографа и продюсера с функционалом портфолио, курсов, клиентов и управления контентом.

---

## Технологический стек

### Frontend

- **Framework**: Next.js 16.1.1 (React 19.2.3)
- **Язык**: TypeScript 5
- **Стилизация**: 
  - Tailwind CSS 4
  - PostCSS
- **UI библиотеки**:
  - Radix UI (компоненты: Accordion, Avatar, Dialog, Label, Progress, Select, Slider, Tabs)
  - Lucide React (иконки)
  - Framer Motion 12.26.2 (анимации)
  - Embla Carousel (карусели)
- **Формы и валидация**:
  - React Hook Form 7.71.1
  - Zod 4.3.5
  - @hookform/resolvers
- **Видео**:
  - Mux Player React 3.10.2
  - Mux Node SDK 12.8.1
- **Аутентификация**:
  - Supabase SSR 0.8.0
  - Supabase JS 2.90.1
- **Email**:
  - Resend 6.7.0
- **Утилиты**:
  - date-fns 4.1.0
  - clsx, tailwind-merge
  - react-markdown 10.1.0

### Backend

- **Framework**: FastAPI 0.115.0
- **Язык**: Python 3
- **Сервер**: Uvicorn 0.32.0 (ASGI)
- **База данных**:
  - PostgreSQL 16 (через Docker)
  - SQLAlchemy 2.0.36 (ORM)
  - AsyncPG 0.30.0 (асинхронный драйвер PostgreSQL)
  - Alembic 1.14.0 (миграции)
- **Аутентификация и безопасность**:
  - Python-JOSE 3.3.0 (JWT токены)
  - Passlib 1.7.4 с bcrypt (хеширование паролей)
- **Валидация данных**:
  - Pydantic 2.9.2
  - Pydantic Settings 2.6.0
  - Email Validator
- **Утилиты**:
  - Python-dotenv 1.0.1
  - HTTPX 0.27.2
  - Python-multipart 0.0.12

### Инфраструктура

- **Контейнеризация**: Docker & Docker Compose
- **База данных**: PostgreSQL 16 (Alpine)
- **Оркестрация**: Docker Compose (dev, prod, базовый)

### Внешние сервисы

- **Видео хостинг**: Mux
- **Email сервис**: Resend
- **Платежи**: YooKassa
- **База данных**: Supabase (для аутентификации)
- **OAuth провайдеры**: Google, Yandex

---

## Структура проекта

```
savage-movie/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Группа маршрутов аутентификации
│   │   ├── callback/             # OAuth callback
│   │   ├── login/                # Страница входа
│   │   └── register/             # Страница регистрации
│   │
│   ├── (marketing)/              # Публичные маршруты
│   │   ├── about/                # О нас
│   │   ├── blog/                 # Блог
│   │   ├── clients/              # Клиенты
│   │   ├── contact/              # Контакты
│   │   ├── courses/              # Курсы
│   │   │   └── [slug]/           # Детальная страница курса
│   │   ├── projects/             # Проекты/Портфолио
│   │   │   └── [slug]/           # Детальная страница проекта
│   │   ├── layout.tsx            # Layout для маркетинга
│   │   └── page.tsx              # Главная страница
│   │
│   ├── admin/                    # Админ-панель
│   │   ├── clients/              # Управление клиентами
│   │   │   ├── [id]/edit/        # Редактирование клиента
│   │   │   ├── new/              # Создание клиента
│   │   │   └── page.tsx          # Список клиентов
│   │   ├── courses/              # Управление курсами
│   │   │   ├── [id]/edit/        # Редактирование курса
│   │   │   ├── new/              # Создание курса
│   │   │   └── page.tsx          # Список курсов
│   │   ├── projects/             # Управление проектами
│   │   │   ├── [id]/edit/        # Редактирование проекта
│   │   │   ├── new/              # Создание проекта
│   │   │   └── page.tsx          # Список проектов
│   │   ├── settings/             # Настройки
│   │   ├── testimonials/         # Управление отзывами
│   │   │   ├── [id]/edit/        # Редактирование отзыва
│   │   │   ├── new/              # Создание отзыва
│   │   │   └── page.tsx          # Список отзывов
│   │   ├── layout.tsx            # Layout админ-панели
│   │   └── page.tsx              # Главная админ-панели
│   │
│   ├── api/                      # Next.js API Routes
│   │   ├── contact/              # Обработка контактной формы
│   │   ├── payments/             # Платежи
│   │   │   ├── create/           # Создание платежа
│   │   │   └── webhook/          # Webhook от YooKassa
│   │   └── uploads/              # Загрузка файлов
│   │
│   ├── booking/                  # Бронирование
│   ├── dashboard/                # Личный кабинет пользователя
│   │   ├── courses/              # Курсы пользователя
│   │   │   └── [slug]/           # Детальная страница курса
│   │   ├── layout.tsx            # Layout дашборда
│   │   └── page.tsx              # Главная дашборда
│   │
│   ├── globals.css               # Глобальные стили
│   ├── layout.tsx                # Корневой layout
│   └── sitemap.ts                # Генерация sitemap
│
├── backend/                      # Python FastAPI Backend
│   ├── app/
│   │   ├── delivery/             # Delivery слой (FastAPI)
│   │   │   └── api/              # API эндпоинты
│   │   │       ├── auth.py       # Аутентификация
│   │   │       ├── clients.py    # Клиенты
│   │   │       ├── contact.py    # Контакты
│   │   │       ├── courses.py    # Курсы
│   │   │       ├── enrollments.py # Записи на курсы
│   │   │       ├── projects.py   # Проекты
│   │   │       ├── settings.py   # Настройки
│   │   │       ├── sitemap.py    # Sitemap
│   │   │       ├── testimonials.py # Отзывы
│   │   │       └── upload.py     # Загрузка файлов
│   │   │
│   │   ├── application/          # Application слой
│   │   │   └── services/         # Application сервисы
│   │   │       └── auth_service.py # JWT и токены
│   │   │
│   │   ├── infrastructure/       # Инфраструктура
│   │   │   ├── db/               # БД и ORM
│   │   │   │   ├── session.py    # Подключение к БД
│   │   │   │   ├── models/       # SQLAlchemy модели
│   │   │   │       ├── booking.py        # Бронирования
│   │   │   │       ├── client.py         # Клиенты
│   │   │   │       ├── contact.py        # Контакты
│   │   │   │       ├── course.py         # Курсы
│   │   │   │       ├── enrollment.py     # Записи на курсы
│   │   │   │       ├── project.py        # Проекты
│   │   │   │       ├── setting.py        # Настройки
│   │   │   │       ├── testimonial.py    # Отзывы
│   │   │   │       └── user.py           # Пользователи
│   │   │   │   └── repositories/ # Репозитории БД
│   │   │   │       ├── clients.py  # Клиенты
│   │   │   │       ├── blog.py  # Блог
│   │   │   │       ├── courses.py  # Курсы
│   │   │   │       ├── enrollments.py # Записи
│   │   │   │       ├── projects.py # Проекты
│   │   │   │       ├── sitemap.py # Sitemap
│   │   │   │       ├── settings.py # Настройки
│   │   │   │       ├── testimonials.py # Отзывы
│   │   │   │       └── users.py # Пользователи
│   │   │   └── integrations/    # Внешние интеграции
│   │   │       ├── email_service.py  # Email сервис
│   │   │       └── oauth_service.py  # OAuth сервис
│   │   │
│   │   ├── interfaces/           # DTO и адаптеры
│   │   │   └── schemas/          # Pydantic схемы
│   │   │       ├── client.py
│   │   │       ├── contact.py
│   │   │       ├── course.py
│   │   │       ├── enrollment.py
│   │   │       ├── project.py
│   │   │       ├── setting.py
│   │   │       ├── testimonial.py
│   │   │       └── user.py
│   │   │
│   │   ├── utils/                # Утилиты
│   │   │   └── security.py       # Безопасность (JWT, пароли)
│   │   │
│   │   ├── middleware/           # Middleware
│   │   ├── config.py            # Конфигурация
│   │   └── main.py              # Точка входа FastAPI
│   │
│   ├── alembic/                  # Alembic миграции
│   │   └── versions/             # Версии миграций
│   │
│   ├── scripts/                  # SQL утилиты для поддержки/восстановления
│   │   ├── check_data.sql        # Проверка данных
│   │   └── fix_display_order.sql # Исправление порядка отображения
│   │
│   ├── uploads/                  # Загруженные файлы
│   │   ├── images/               # Изображения
│   │   └── videos/               # Видео
│   │
│   ├── requirements.txt          # Python зависимости
│   └── README.md
│
├── components/                   # React компоненты
│   ├── admin/                    # Админ компоненты
│   │   ├── ArrayInput.tsx
│   │   ├── DataTable.tsx
│   │   └── FileUpload.tsx
│   │
│   ├── auth/                     # Компоненты аутентификации
│   │   └── OAuthButtons.tsx
│   │
│   ├── features/                 # Функциональные компоненты
│   │   ├── CourseCard.tsx
│   │   ├── CourseEnrollmentButton.tsx
│   │   ├── FullScreenVideoPlayer.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectMetaPanel.tsx
│   │   ├── ProjectPlayerWall.tsx
│   │   ├── ProjectRow.tsx
│   │   ├── ProjectThumbRail.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── VideoStage.tsx
│   │   └── WorkCard.tsx
│   │
│   ├── providers/                # React провайдеры
│   │   └── page-transitions.tsx
│   │
│   ├── sections/                 # Секции страниц
│   │   ├── AboutTeaser.tsx
│   │   ├── BookingModal.tsx
│   │   ├── ClientsList.tsx
│   │   ├── ClientsSection.tsx
│   │   ├── ContactForm.tsx
│   │   ├── CTASection.tsx
│   │   ├── FeaturedProjects.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HeroSectionClient.tsx
│   │   ├── MarketingLayoutClient.tsx
│   │   ├── Navigation.tsx
│   │   ├── NavigationWrapper.tsx
│   │   ├── NewsletterSection.tsx
│   │   ├── ProjectsGrid.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── UserMenu.tsx
│   │
│   └── ui/                       # UI компоненты (shadcn/ui)
│       ├── accordion.tsx
│       ├── avatar.tsx
│       ├── back-button.tsx
│       ├── badge.tsx
│       ├── breadcrumbs.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── dialog.tsx
│       ├── editorial-correction.tsx
│       ├── filter-chips.tsx
│       ├── form.tsx
│       ├── fullscreen-menu-overlay.tsx
│       ├── grain-overlay.tsx
│       ├── graphic-marks.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menu-row.tsx
│       ├── preloader.tsx
│       ├── premium-slider.tsx
│       ├── progress.tsx
│       ├── section-title.tsx
│       ├── select.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── storyline-text.tsx
│       ├── strikethrough-text.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
│
├── lib/                          # Утилиты и библиотеки
│   ├── api/                      # API клиенты
│   │   ├── auth.ts              # Аутентификация
│   │   ├── client.ts            # Базовый клиент
│   │   ├── clients.ts           # Клиенты API
│   │   ├── courses.ts           # Курсы API
│   │   ├── enrollments.ts       # Записи API
│   │   ├── projects.ts          # Проекты API
│   │   ├── server.ts            # Серверный клиент
│   │   ├── settings.ts          # Настройки API
│   │   ├── testimonials.ts      # Отзывы API
│   │   └── upload.ts            # Загрузка API
│   │
│   ├── email/                    # Email утилиты
│   │   └── resend.ts
│   │
│   ├── mux/                      # Mux интеграция
│   │   └── client.ts
│   │
│   ├── payments/                 # Платежи
│   │   └── yookassa.ts
│   │
│   └── utils.ts                  # Общие утилиты
│
├── types/                        # TypeScript типы (зарезервировано)
│
├── public/                       # Статические файлы
│   ├── robots.txt
│   └── [svg иконки]
│
│
├── scripts/                      # Скрипты развертывания
│   ├── create-admin-*.sh        # Создание админа
│   ├── docker-init-db.sh        # Инициализация БД в Docker
│   └── init-docker.sh           # Инициализация Docker
│
├── docker-compose.yml            # Docker Compose (базовый)
├── docker-compose.dev.yml        # Docker Compose (разработка)
├── docker-compose.prod.yml       # Docker Compose (продакшн)
│
├── Dockerfile.backend            # Dockerfile для backend
├── Dockerfile.frontend           # Dockerfile для frontend (prod)
├── Dockerfile.frontend.dev       # Dockerfile для frontend (dev)
│
├── next.config.ts                # Конфигурация Next.js
├── tsconfig.json                 # Конфигурация TypeScript
├── postcss.config.mjs            # Конфигурация PostCSS
├── eslint.config.mjs             # Конфигурация ESLint
├── components.json               # Конфигурация shadcn/ui
│
├── package.json                  # Node.js зависимости
└── README.md                     # Документация проекта
```

---

## Архитектура

### Frontend (Next.js)

- **App Router**: Используется новый App Router Next.js 16
- **Server Components**: По умолчанию компоненты серверные
- **Client Components**: Помечены директивой `"use client"`
- **API Routes**: Next.js API routes для некоторых эндпоинтов
- **Стилизация**: Tailwind CSS с кастомными компонентами

### Backend (FastAPI)

- **Архитектура**: RESTful API
- **Асинхронность**: Полностью асинхронный (async/await)
- **ORM**: SQLAlchemy 2.0 с async поддержкой
- **Валидация**: Pydantic схемы для запросов/ответов
- **Аутентификация**: JWT токены + OAuth (Google, Yandex)

### База данных

- **СУБД**: PostgreSQL 16
- **ORM**: SQLAlchemy (async)
- **Миграции**: Alembic
- **Схема**: Модели для пользователей, проектов, курсов, клиентов, отзывов, настроек

### Docker

- **3 сервиса**: PostgreSQL, FastAPI Backend, Next.js Frontend
- **Сети**: Изолированная Docker сеть
- **Volumes**: Персистентное хранилище для БД и загрузок
- **Healthchecks**: Проверка здоровья сервисов

---

## Основные функции

1. **Портфолио проектов** — показ видеопроектов с видео плеером
2. **Курсы** — онлайн курсы с возможностью записи
3. **Клиенты** — управление клиентской базой
4. **Отзывы** — система отзывов
5. **Контактная форма** — обратная связь
6. **Админ-панель** — CRUD для всех сущностей
7. **Аутентификация** — JWT + OAuth (Google, Yandex)
8. **Платежи** — интеграция с YooKassa
9. **Видео** — интеграция с Mux для видео хостинга
10. **Email** — отправка писем через Resend

---

## Порты

- **Frontend**: 3000
- **Backend API**: 8001 (на хосте) / 8000 (в контейнере)
- **PostgreSQL**: 5433 (на хосте) / 5432 (в контейнере)

---

## Переменные окружения

### Frontend
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_YANDEX_CLIENT_ID`
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- `NEXT_PUBLIC_MUX_ENV_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`

### Backend
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_ALGORITHM`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`
- `CORS_ORIGINS`
- `RESEND_API_KEY`
- `ADMIN_EMAIL`
