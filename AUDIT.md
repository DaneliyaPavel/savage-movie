# Полный аудит проекта Savage Movie

**Дата:** 2026-01-26  
**Версия:** 1.0  
**Статус:** Discovery + Full Audit (без правок кода)

---

## Этап 0: Discovery — Карта проекта

### Package Manager

- **Frontend**: `npm` (есть `package-lock.json`)
- **Backend**: `pip` (есть `requirements.txt`, нет `pyproject.toml`, нет `poetry.lock`)

### Команды проверки (обнаружено)

#### Frontend

- `npm install` — установка зависимостей
- `npm run lint` — ESLint проверка
- `npm run type-check` — TypeScript проверка (`tsc --noEmit`)
- `npm run test` — Vitest тесты
- `npm run build` — Next.js production build

#### Backend

- `pip install -r backend/requirements.txt` — установка зависимостей
- **Lint**: отсутствует (нет ruff/flake8 в requirements.txt)
- **Typecheck**: отсутствует (нет mypy/pyright)
- **Test**: отсутствует (нет pytest в requirements.txt)
- `uvicorn app.main:app --reload --port 8000` — запуск dev сервера

#### Docker

- `docker compose -f docker-compose.yml up --build` — dev окружение
- `docker compose -f docker-compose.yml up --build` — prod окружение
- Healthchecks: только у БД, отсутствуют у backend/frontend

### Точки входа

#### Frontend (Next.js 16 App Router)

- **Entry**: `app/layout.tsx` (корневой layout)
- **Route Groups**:
  - `(auth)` — `/login`, `/register`, `/callback`
  - `(marketing)` — публичные страницы (`/`, `/projects`, `/courses`, `/blog`, `/clients`, `/contact`, `/about`, `/studio`)
  - `admin` — админ-панель (CRUD для всех сущностей)
  - `dashboard` — личный кабинет пользователя
- **API Routes**: `app/api/*` (contact, payments, uploads, auth/session)

#### Backend (FastAPI)

- **Entry**: `backend/app/main.py`
- **Routers**: `backend/app/delivery/api/*` (auth, projects, courses, enrollments, contact, sitemap, upload, clients, testimonials, settings, payments, blog)

### Поток запросов

1. **Client Components** → `lib/api/client.ts` → FastAPI (`NEXT_PUBLIC_API_URL`)
2. **Server Components** → `lib/api/server.ts` → FastAPI (`API_URL` или `NEXT_PUBLIC_API_URL`)
3. **Next API Routes**:
   - `/api/contact` → валидация → `lib/api/server.ts` → FastAPI `/api/contact`
   - `/api/payments/create` → `lib/payments/yookassa.ts` (собственная логика создания платежа)
   - `/api/payments/webhook` → прокси → FastAPI `/api/payments/yookassa/webhook`
   - `/api/uploads/[...path]` → прокси файлов из `backend/uploads`
   - `/api/auth/session` → проверка сессии

### Контракты типов/схем

- **Backend**: Pydantic схемы в `backend/app/interfaces/schemas/*`
- **Frontend**: TypeScript интерфейсы в `lib/api/*.ts` (ручные, не генерируются)
- **Проблема**: Нет синхронизации, высокий риск рассинхронизации

---

## A) Frontend Audit

### Слои и структура

#### Routes (`app/`)

- ✅ Четкая структура route groups: `(auth)`, `(marketing)`, `admin`, `dashboard`
- ⚠️ Смешение server/client компонентов: некоторые страницы полностью client-only, хотя могут быть server-first
- ⚠️ Route-specific компоненты разбросаны: часть в `app/*/client.tsx`, часть в `components/sections`

#### Components (`components/`)

- ✅ `components/ui/` — shadcn/ui примитивы (хорошо изолированы)
- ⚠️ `components/features/` — доменные компоненты (VideoPlayer, ProjectCard, CourseCard)
- ⚠️ `components/sections/` — секции страниц (HeroSection, Footer, Navigation)
- ⚠️ `components/admin/` — админ компоненты
- ⚠️ `components/auth/` — компоненты аутентификации
- **Проблема**: Нет четкого разделения feature vs shared vs layout

#### Lib (`lib/`)

- ✅ `lib/api/` — API клиенты (client/server/base)
- ✅ `lib/env.ts` + `lib/env.server.ts` — валидация env
- ✅ `lib/integrations/` — Mux, Resend, YooKassa
- ✅ `lib/utils/` — утилиты (logger, slugify, path-utils)
- ⚠️ `lib/marketing-mappers.ts` — мапперы для маркетинга (лучше в feature модуль)
- ⚠️ `lib/projects/orientation.ts` — ориентация проектов (лучше в feature модуль)

### Дубли/мертвые компоненты/лишние файлы

#### Дубли компонентов

1. **ShowreelHero**:
   - `components/sections/ShowreelHero.tsx` — НЕ используется
   - `components/sections/showreel-hero.tsx` — ✅ используется в `app/(marketing)/page.tsx`
   - **Решение**: Удалить `ShowreelHero.tsx`

2. **VideoPlayer**:
   - `components/features/VideoPlayer.tsx` — используется в нескольких местах
   - `components/features/mux-player.tsx` — используется в `showreel-hero.tsx`
   - **Проблема**: Два разных компонента для одной цели
   - **Решение**: Унифицировать или четко разделить ответственность

3. **HeroSection**:
   - `components/sections/HeroSection.tsx` — НЕ используется
   - `components/sections/HeroSectionClient.tsx` — НЕ используется
   - **Решение**: Удалить оба

#### Мертвые компоненты (нет импортов)

- `components/sections/ContactForm.tsx` — используется только в неиспользуемом `app/(marketing)/contact/client.tsx`
- `components/sections/ServicesSection.tsx`
- `components/sections/AboutTeaser.tsx`
- `components/sections/FeaturedProjects.tsx`
- `components/sections/ProjectsGrid.tsx`
- `components/sections/CTASection.tsx` — ⚠️ используется в `components/sections/ContactForm.tsx` (который не используется)
- `components/sections/NewsletterSection.tsx`
- `components/sections/TestimonialsSection.tsx` — ⚠️ проверка: может использоваться в server components
- `components/sections/ClientsSection.tsx`
- `components/sections/UserMenu.tsx`
- `components/features/WorkCard.tsx` — используется только в неиспользуемом `FeaturedProjects.tsx`
- `components/features/ProjectCard.tsx` — используется только в неиспользуемом `ProjectsGrid.tsx`
- `components/features/ProjectPlayerWall.tsx`
- `components/features/ProjectThumbRail.tsx`
- `components/features/VideoStage.tsx`
- `components/features/ProjectRow.tsx` — ⚠️ есть также `ProjectRow3Column.tsx`, проверить использование

#### Неиспользуемые page-specific клиенты

- `app/(marketing)/home-client.tsx` — не импортируется
- `app/(marketing)/projects/client.tsx` — не импортируется (используется `projects-client.tsx`)
- `app/(marketing)/courses/client.tsx` — не импортируется
- `app/(marketing)/contact/client.tsx` — не импортируется
- `app/(marketing)/about/client.tsx` — не импортируется

### Server/Client логика

#### Проблемы

1. **Двойная загрузка данных**:
   - `app/(marketing)/projects/page.tsx` (server) + `app/(marketing)/projects/projects-client.tsx` (client)
   - Данные загружаются на сервере, затем повторно на клиенте

2. **Client-only страницы**:
   - `app/(marketing)/courses/page.tsx` — полностью client-only, хотя может быть server-first
   - `app/booking/page.tsx` — client-only (только Calendly iframe)

3. **Смешение "use client"**:
   - Некоторые компоненты помечены "use client" без необходимости
   - Некоторые server components используют client-only API

#### Next API Routes vs FastAPI

- `/api/contact` — валидация + прокси на FastAPI (дублирование валидации)
- `/api/payments/create` — собственная логика (YooKassa), не использует FastAPI
- `/api/payments/webhook` — тонкий прокси на FastAPI
- `/api/uploads` — прокси файлов
- **Проблема**: Размытая граница ответственности между Next API routes и FastAPI

### Env и секреты

#### Проблемы

1. **Неполная валидация**:
   - `NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID` используется в `app/(marketing)/page.tsx`, но отсутствует в `lib/env.ts`
   - Прямые обращения к `process.env` в некоторых компонентах

2. **Потенциальные утечки**:
   - `lib/email/resend.ts` — содержит доступ к `RESEND_API_KEY`, но файл не используется
   - Проверка: нет случайных импортов в client components

3. **Согласованность**:
   - ✅ Есть `lib/env.ts` (public) и `lib/env.server.ts` (server-only)
   - ⚠️ Не все компоненты используют эти модули

### Архитектурные проблемы

1. **Нет четкого разделения features**:
   - Feature-логика разбросана между `components/features`, `components/sections`, `lib/*`, `app/*`
   - Нет модульной структуры по доменам (projects/courses/blog/clients)

2. **Colocation**:
   - Route-specific компоненты не всегда рядом с route
   - Общие компоненты смешаны с feature-специфичными

3. **Импорты**:
   - Используются absolute imports через `@/*` (хорошо)
   - Но нет единого стиля (иногда `@/components`, иногда `@/lib`)

---

## B) Backend Audit

### Слои (Clean Architecture)

#### Delivery (`backend/app/delivery/api/`)

- ✅ Роутеры изолированы
- ⚠️ **Проблема**: Роутеры напрямую используют репозитории и ORM, минуя application слой
- ⚠️ Бизнес-логика в роутерах (например, `payments.py` содержит логику обработки webhook)

#### Application (`backend/app/application/`)

- ✅ Есть `services/auth_service.py` (JWT, токены)
- ⚠️ **Проблема**: Остальная бизнес-логика в роутерах, нет use cases
- ⚠️ Нет единого слоя транзакций/юнитов работы

#### Infrastructure (`backend/app/infrastructure/`)

- ✅ `db/models/` — SQLAlchemy модели
- ✅ `db/repositories/` — репозитории
- ✅ `db/session.py` — сессия БД
- ✅ `integrations/` — email, OAuth
- ⚠️ **Проблема**: Репозитории коммитят внутри методов (нет единого UoW)

#### Interfaces (`backend/app/interfaces/schemas/`)

- ✅ Pydantic схемы для запросов/ответов
- ⚠️ **Проблема**: Нет мапперов между схемами и моделями (прямое использование dict)

### ORM/миграции/схемы

#### Миграции

- ✅ Alembic используется (`backend/alembic/versions/`)
- ⚠️ **Проблема**: Параллельно есть SQL-скрипты в `backend/scripts/*.sql` без привязки к Alembic
- ⚠️ Риск дрейфа: "второй источник истины" для схемы БД

#### Репозитории

- ✅ Есть репозитории для всех сущностей
- ⚠️ **Проблема**: Репозитории коммитят внутри методов (`await self._session.commit()`)
- ⚠️ Нет единого уровня транзакций (UoW pattern)
- ⚠️ Нет обработки транзакций на уровне application

#### Схемы Pydantic

- ✅ Схемы для всех сущностей
- ⚠️ **Проблема**: Нет мапперов между схемами и моделями
- ⚠️ Прямое использование `dict` для создания/обновления

### Нейминг и согласованность

#### Несогласованности

1. **blog vs blog_post**:
   - Модель: `backend/app/infrastructure/db/models/blog_post.py` (BlogPost)
   - Репозиторий: `backend/app/infrastructure/db/repositories/blog.py` (SqlAlchemyBlogRepository)
   - Роутер: `backend/app/delivery/api/blog.py`
   - Схема: `backend/app/interfaces/schemas/blog.py`
   - **Решение**: Унифицировать (предпочтительно `blog` везде)

2. **setting vs settings**:
   - Модель: `backend/app/infrastructure/db/models/setting.py` (Setting)
   - Репозиторий: `backend/app/infrastructure/db/repositories/settings.py`
   - Роутер: `backend/app/delivery/api/settings.py`
   - Схема: `backend/app/interfaces/schemas/setting.py`
   - **Решение**: Унифицировать (предпочтительно `settings` везде, т.к. это коллекция настроек)

3. **clients vs client**:
   - Модель: `backend/app/infrastructure/db/models/client.py` (Client)
   - Репозиторий: `backend/app/infrastructure/db/repositories/clients.py` (SqlAlchemyClientsRepository)
   - Роутер: `backend/app/delivery/api/clients.py`
   - Схема: `backend/app/interfaces/schemas/client.py`
   - **Решение**: Унифицировать (предпочтительно `clients` для репозитория/роутера, `client` для модели/схемы)

### Потенциальные функциональные риски

1. **Auth refresh endpoint**:
   - `POST /api/auth/refresh` — проверить сигнатуру (query vs body)
   - Frontend отправляет JSON body (`lib/api/auth.ts`)

2. **Uploads**:
   - `backend/app/delivery/api/upload.py` управляет файловой системой напрямую
   - Создает директории при импорте модуля
   - Это инфраструктурная ответственность, усложняет тестирование

3. **Booking модель**:
   - Модель `backend/app/infrastructure/db/models/booking.py` существует
   - Нет репозитория, роутера, схемы
   - Используется только Calendly iframe (`app/booking/page.tsx`)
   - **Вопрос**: Нужна ли модель Booking или это legacy?

### Тестирование

- ❌ Нет тестов для backend
- ❌ Нет pytest в `requirements.txt`
- ❌ Нет структуры `backend/tests/`

---

## C) Shared/Contract Audit

### Синхронизация DTO/схем

#### Проблема

- **Backend**: Pydantic схемы в `backend/app/interfaces/schemas/*`
- **Frontend**: TypeScript интерфейсы в `lib/api/*.ts` (ручные)
- **Нет генерации типов** из OpenAPI
- **Высокий риск рассинхронизации**

#### Примеры рассинхронизации

1. **Auth refresh**: Frontend отправляет JSON body, backend может ожидать query
2. **Типы проектов**: Frontend использует свои интерфейсы, backend — Pydantic схемы
3. **Ошибки**: Frontend ожидает `{ detail: string }`, но не всегда согласовано

### Решение

- Генерировать TypeScript типы из OpenAPI (FastAPI автоматически генерирует OpenAPI spec)
- Использовать `openapi-typescript` или аналоги
- Разместить сгенерированные типы в `contracts/` или `lib/api/generated/`

### Платежи

- **Next API route** (`/api/payments/create`) — создание платежа (собственная логика)
- **FastAPI** (`/api/payments/yookassa/webhook`) — обработка webhook
- **Проблема**: Контракт и ответственность разнесены между двумя сервисами

---

## D) Infra Audit

### Docker Compose

#### Файлы

- `docker-compose.yml` — базовый (prod-like)
- `docker-compose.yml` — dev с hot reload
- `docker-compose.yml` — production

#### Проблемы

1. **Healthchecks**:
   - ✅ Есть у БД
   - ❌ Отсутствуют у backend/frontend

2. **Volumes**:
   - ✅ `postgres_data` — персистентное хранилище БД
   - ✅ `./backend/uploads:/app/backend/uploads` — загрузки
   - ⚠️ В dev: `./backend:/app/backend` (весь код)

3. **Env переменные**:
   - ⚠️ Дублирование между `docker-compose*.yml` и `.env.example`
   - ⚠️ Некоторые переменные хардкодятся в compose файлах

### Переменные окружения

#### Frontend (`.env.example`)

- ✅ Покрывает основные переменные
- ⚠️ Отсутствует `NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID` (используется в коде)

#### Backend (`backend/.env.example`)

- ✅ Существует
- ✅ Покрывает основные переменные

### Скрипты

#### Дублирование

- `scripts/create-admin*.sh` — 3 варианта скрипта создания админа
- `docker-start.sh` — дублирует функциональность `docker-compose`
- `scripts/docker-dev.sh` — обертка над `docker-compose.yml`
- `START_SERVER.sh` — предполагает `backend/venv`, которого нет в репозитории

#### Рекомендации

- Унифицировать скрипты создания админа
- Удалить дублирующие скрипты
- Обновить `START_SERVER.sh` или удалить

---

## E) "Удаляемое" (кандидаты с доказательствами)

### Критерии

- Нет импортов/использования в коде
- Нет упоминаний в конфигах/скриптах
- Не является entry point

### Кандидаты на удаление

#### Frontend

1. **Компоненты (нет импортов)**:
   - `components/sections/ShowreelHero.tsx` — дубль `showreel-hero.tsx`
   - `components/sections/HeroSection.tsx`
   - `components/sections/HeroSectionClient.tsx`
   - `components/sections/ContactForm.tsx` — используется только в неиспользуемом `contact/client.tsx`
   - `components/sections/ServicesSection.tsx`
   - `components/sections/AboutTeaser.tsx`
   - `components/sections/FeaturedProjects.tsx`
   - `components/sections/ProjectsGrid.tsx`
   - `components/sections/CTASection.tsx` — используется только в `ContactForm.tsx`
   - `components/sections/NewsletterSection.tsx`
   - `components/sections/ClientsSection.tsx`
   - `components/sections/UserMenu.tsx`
   - `components/features/WorkCard.tsx` — используется только в `FeaturedProjects.tsx`
   - `components/features/ProjectCard.tsx` — используется только в `ProjectsGrid.tsx`
   - `components/features/ProjectPlayerWall.tsx`
   - `components/features/ProjectThumbRail.tsx`
   - `components/features/VideoStage.tsx`
   - `components/features/ProjectRow.tsx` — проверить vs `ProjectRow3Column.tsx`

2. **Page-specific клиенты (не импортируются)**:
   - `app/(marketing)/home-client.tsx`
   - `app/(marketing)/projects/client.tsx` — используется `projects-client.tsx`
   - `app/(marketing)/courses/client.tsx`
   - `app/(marketing)/contact/client.tsx`
   - `app/(marketing)/about/client.tsx`

3. **Lib (не используется)**:
   - `lib/email/resend.ts` — нет импортов

4. **Пустые директории**:
   - `types/` — пустая директория

#### Backend

1. **Модели (нет использования)**:
   - `backend/app/infrastructure/db/models/booking.py` — нет репозитория/роутера/схемы
   - **Вопрос**: Нужна ли модель Booking или это legacy (Calendly-only)?

2. **SQL скрипты (риск дрейфа)**:
   - `backend/scripts/*.sql` — не привязаны к Alembic, риск рассинхронизации
   - **Рекомендация**: Мигрировать в Alembic или удалить

### Процесс удаления

1. **Soft delete**: Переместить кандидатов в `/_trash`
2. **Проверки**: Прогнать `npm run lint`, `npm run type-check`, `npm run build`, `npm run test`
3. **Backend**: Проверить запуск `uvicorn app.main:app`
4. **Окончательное удаление**: После подтверждения работоспособности

---

## Итоговые метрики

### Frontend

- **Компоненты**: ~35 файлов в `components/`
- **Мертвые компоненты**: ~20 кандидатов
- **Дубли**: 2-3 пары компонентов
- **API клиенты**: 10 файлов в `lib/api/`

### Backend

- **Роутеры**: 12 файлов
- **Модели**: 9 файлов (включая booking)
- **Репозитории**: 9 файлов
- **Схемы**: 9 файлов
- **Тесты**: 0

### Инфраструктура

- **Docker compose**: 3 файла
- **Скрипты**: 10+ файлов (есть дубли)
- **Env примеры**: 2 файла

---

## Следующие шаги

1. ✅ **Этап 0 (Discovery)**: Завершен
2. ✅ **Этап 1 (Full Audit)**: Завершен
3. ⏭️ **Этап 2**: Создать `TARGET_STRUCTURE.md` и план батчей
4. ⏭️ **Этап 3**: Реализация батчами (после утверждения плана)
