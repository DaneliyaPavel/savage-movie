# Целевая структура и план реорганизации

**Дата:** 2026-01-26  
**Версия:** 2.0 (обновлено после полного аудита)

---

## Цели реорганизации

1. ✅ Сделать структуру читаемой и предсказуемой без изменения поведения
2. ✅ Упростить навигацию по feature-модулям (projects/courses/blog/clients/testimonials/auth/payments/uploads)
3. ✅ Согласовать контракты фронт/бэк и минимизировать дрейф типов
4. ✅ Удалить только доказуемо неиспользуемые файлы через soft delete
5. ✅ Усилить Clean Architecture в backend без breaking changes
6. ✅ Унифицировать нейминг и соглашения

---

## Предлагаемая структура (high-level)

```
savage-movie/
├── app/                              # Next.js App Router (маршруты)
│   ├── (auth)/                       # Группа маршрутов аутентификации
│   │   ├── callback/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (marketing)/                  # Публичные маршруты
│   │   ├── page.tsx                  # Главная
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx
│   │   │   └── _components/          # route-specific UI (colocated)
│   │   │       └── projects-client.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx
│   │   │   └── _components/
│   │   ├── blog/
│   │   ├── clients/
│   │   ├── contact/
│   │   ├── about/
│   │   └── studio/
│   │
│   ├── admin/                        # Админ-панель
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   └── _components/          # route-specific компоненты
│   │   ├── courses/
│   │   ├── clients/
│   │   ├── testimonials/
│   │   ├── blog/
│   │   └── settings/
│   │
│   ├── dashboard/                    # Личный кабинет
│   │   ├── page.tsx
│   │   ├── courses/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── _components/
│   │
│   ├── booking/                      # Бронирование (Calendly)
│   │   └── page.tsx
│   │
│   ├── api/                          # Next.js API Routes (только edge/bridge)
│   │   ├── contact/                  # Валидация + прокси на FastAPI
│   │   ├── payments/
│   │   │   ├── create/               # Создание платежа (YooKassa)
│   │   │   └── webhook/              # Прокси на FastAPI
│   │   ├── uploads/                  # Прокси файлов
│   │   └── auth/
│   │       └── session/              # Проверка сессии
│   │
│   ├── layout.tsx                    # Корневой layout
│   ├── globals.css
│   ├── sitemap.ts
│   └── robots.ts
│
├── components/
│   ├── ui/                           # shadcn/ui + базовые примитивы (неизменно)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── ...
│   │
│   ├── layout/                       # Layout компоненты (navigation/footer/overlays)
│   │   ├── Navigation.tsx
│   │   ├── NavigationWrapper.tsx
│   │   ├── Footer.tsx
│   │   ├── UserMenu.tsx
│   │   └── ...
│   │
│   └── shared/                       # Общие, не доменные компоненты
│       ├── ErrorBoundary.tsx
│       └── ...
│
├── features/                         # Feature-модули (доменная логика)
│   ├── projects/
│   │   ├── components/               # Доменные компоненты
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectRow.tsx
│   │   │   ├── ProjectPlayerWall.tsx
│   │   │   ├── ProjectThumbRail.tsx
│   │   │   ├── VideoPlayer.tsx       # Унифицированный VideoPlayer
│   │   │   └── ...
│   │   ├── api.ts                    # API клиент для projects
│   │   ├── types.ts                  # Типы для projects
│   │   └── utils.ts                  # Утилиты (orientation, мапперы)
│   │
│   ├── courses/
│   │   ├── components/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseEnrollmentButton.tsx
│   │   │   └── ...
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── blog/
│   │   ├── components/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── clients/
│   │   ├── components/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── testimonials/
│   │   ├── components/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── auth/
│   │   ├── components/
│   │   │   └── OAuthButtons.tsx
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── payments/
│   │   ├── api.ts                    # YooKassa интеграция
│   │   ├── types.ts
│   │   └── schemas.ts                # create-payment-schema
│   │
│   └── uploads/
│       ├── api.ts
│       └── types.ts
│
├── lib/
│   ├── api/                          # Базовый HTTP клиент
│   │   ├── base.ts                   # baseApiRequest
│   │   ├── client.ts                 # Client-side API
│   │   └── server.ts                 # Server-side API
│   │
│   ├── env.ts                        # Public env валидация
│   ├── env.server.ts                 # Server-only env
│   ├── i18n-context.tsx              # i18n провайдер
│   │
│   ├── integrations/                 # Внешние интеграции
│   │   ├── mux/
│   │   │   └── client.ts
│   │   ├── resend/
│   │   │   └── client.ts             # Перенести из lib/email/resend.ts
│   │   └── yookassa/
│   │       └── client.ts             # Перенести из lib/payments/yookassa.ts
│   │
│   └── utils/                        # Общие утилиты
│       ├── logger.ts
│       ├── slugify.ts
│       ├── path-utils.ts
│       └── index.ts
│
├── contracts/                        # Generated OpenAPI -> TS types (optional)
│   └── generated/
│       └── api.ts                    # openapi-typescript output
│
├── backend/
│   ├── app/
│   │   ├── delivery/                 # HTTP слой (FastAPI)
│   │   │   ├── api/
│   │   │   │   ├── auth.py
│   │   │   │   ├── projects.py
│   │   │   │   ├── courses.py
│   │   │   │   ├── blog.py           # Унифицировать нейминг (blog везде)
│   │   │   │   ├── clients.py
│   │   │   │   ├── testimonials.py
│   │   │   │   ├── settings.py       # Унифицировать нейминг (settings везде)
│   │   │   │   ├── enrollments.py
│   │   │   │   ├── contact.py
│   │   │   │   ├── payments.py
│   │   │   │   ├── upload.py
│   │   │   │   └── sitemap.py
│   │   │   │
│   │   │   └── dependencies.py       # FastAPI dependencies (auth, db)
│   │   │
│   │   ├── interfaces/               # DTO и адаптеры
│   │   │   ├── schemas/              # Pydantic схемы
│   │   │   │   ├── project.py
│   │   │   │   ├── course.py
│   │   │   │   ├── blog.py           # Унифицировать нейминг
│   │   │   │   ├── client.py
│   │   │   │   ├── testimonial.py
│   │   │   │   ├── setting.py        # Переименовать в settings.py?
│   │   │   │   ├── enrollment.py
│   │   │   │   ├── contact.py
│   │   │   │   ├── user.py
│   │   │   │   └── payment.py
│   │   │   │
│   │   │   └── mappers/              # Мапперы между схемами и моделями
│   │   │       ├── project_mapper.py
│   │   │       ├── course_mapper.py
│   │   │       └── ...
│   │   │
│   │   ├── application/              # Use-cases/services
│   │   │   ├── use_cases/            # Бизнес-логика
│   │   │   │   ├── projects/
│   │   │   │   │   ├── create_project.py
│   │   │   │   │   ├── update_project.py
│   │   │   │   │   └── delete_project.py
│   │   │   │   ├── courses/
│   │   │   │   ├── enrollments/
│   │   │   │   │   └── process_payment.py
│   │   │   │   └── payments/
│   │   │   │       └── process_yookassa_webhook.py
│   │   │   │
│   │   │   └── services/            # Application сервисы
│   │   │       ├── auth_service.py   # JWT, токены
│   │   │       └── unit_of_work.py   # UoW для транзакций
│   │   │
│   │   ├── domain/                   # Опционально: сущности/ошибки (если нужен)
│   │   │   ├── entities/
│   │   │   └── exceptions.py
│   │   │
│   │   ├── infrastructure/           # БД, интеграции, storage
│   │   │   ├── db/
│   │   │   │   ├── models/           # SQLAlchemy модели
│   │   │   │   │   ├── project.py
│   │   │   │   │   ├── course.py
│   │   │   │   │   ├── blog_post.py  # Переименовать в blog.py?
│   │   │   │   │   ├── client.py
│   │   │   │   │   ├── testimonial.py
│   │   │   │   │   ├── setting.py    # Переименовать в settings.py?
│   │   │   │   │   ├── enrollment.py
│   │   │   │   │   ├── contact.py
│   │   │   │   │   ├── user.py
│   │   │   │   │   └── booking.py    # Удалить или оставить (вопрос)
│   │   │   │   │
│   │   │   │   ├── repositories/     # Репозитории БД
│   │   │   │   │   ├── projects.py
│   │   │   │   │   ├── courses.py
│   │   │   │   │   ├── blog.py       # Унифицировать нейминг
│   │   │   │   │   ├── clients.py
│   │   │   │   │   ├── testimonials.py
│   │   │   │   │   ├── settings.py
│   │   │   │   │   ├── enrollments.py
│   │   │   │   │   ├── users.py
│   │   │   │   │   └── sitemap.py
│   │   │   │   │
│   │   │   │   └── session.py        # Подключение к БД
│   │   │   │
│   │   │   └── integrations/         # Внешние интеграции
│   │   │       ├── email_service.py
│   │   │       ├── oauth_service.py
│   │   │       └── storage_service.py # Управление uploads
│   │   │
│   │   ├── middleware/              # Middleware (если нужен)
│   │   │
│   │   ├── config.py                 # Конфигурация
│   │   └── main.py                   # Точка входа FastAPI
│   │
│   ├── alembic/                      # Alembic миграции
│   │   └── versions/
│   │
│   ├── scripts/                      # SQL утилиты (мигрировать в Alembic или удалить)
│   │   ├── check_data.sql
│   │   └── fix_display_order.sql
│   │
│   ├── tests/                        # Тесты (создать структуру)
│   │   ├── conftest.py
│   │   ├── test_projects.py
│   │   └── ...
│   │
│   ├── uploads/                      # Загруженные файлы (gitignored)
│   │   ├── images/
│   │   └── videos/
│   │
│   ├── requirements.txt              # Python зависимости
│   ├── requirements-dev.txt          # Dev зависимости (ruff, pytest, mypy)
│   └── README.md
│
├── _trash/                           # Soft delete (кандидаты на удаление)
│   ├── components/
│   ├── app/
│   └── lib/
│
├── docker-compose.yml                # Базовый
├── docker-compose.dev.yml            # Dev
├── docker-compose.prod.yml           # Prod
│
├── Dockerfile.backend
├── Dockerfile.frontend
├── Dockerfile.frontend.dev
│
├── scripts/                          # Унифицированные скрипты
│   ├── docker-dev.sh                 # Единый скрипт для dev
│   ├── docker-prod.sh                # Единый скрипт для prod
│   └── create-admin.sh               # Единый скрипт создания админа
│
├── .env.example                      # Frontend + интеграции
├── backend/.env.example              # Backend
│
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## План реорганизации (батчами)

### Batch A — Инструменты и базовые соглашения

**Цель**: Единые env- и lint-конвенции, минимальные проверки, базовые инструменты.

#### Задачи
1. **Env валидация**:
   - Добавить `NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID` в `lib/env.ts`
   - Проверить все прямые обращения к `process.env` и заменить на `lib/env.ts`

2. **Backend инструменты**:
   - Создать `backend/requirements-dev.txt` с ruff, pytest, mypy
   - Добавить базовые конфиги (`.ruff.toml`, `pytest.ini`, `mypy.ini`)

3. **Editor config**:
   - Создать `.editorconfig` (если нужен)

4. **Gitignore**:
   - Убедиться, что `backend/uploads/` в `.gitignore`
   - Проверить другие артефакты

#### Файлы/папки
- `.env.example` (дополнить `NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID`)
- `backend/requirements-dev.txt`
- `backend/.ruff.toml` (опционально)
- `backend/pytest.ini` (опционально)
- `backend/mypy.ini` (опционально)
- `.editorconfig` (опционально)

#### Импорты
- Не затрагиваем

#### Проверки
- Frontend: `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`
- Backend: `pip install -r backend/requirements-dev.txt`, `ruff check backend/`, `mypy backend/`

---

### Batch B — Frontend реорганизация без изменения поведения

**Цель**: Разграничить route-specific и shared/feature код, убрать дубли, создать feature-модули.

#### Задачи
1. **Создать структуру `features/`**:
   - `features/projects/` — компоненты, API, типы, утилиты
   - `features/courses/` — компоненты, API, типы
   - `features/blog/` — компоненты, API, типы
   - `features/clients/` — компоненты, API, типы
   - `features/testimonials/` — компоненты, API, типы
   - `features/auth/` — компоненты, API, типы
   - `features/payments/` — API, типы, схемы
   - `features/uploads/` — API, типы

2. **Переместить компоненты**:
   - Из `components/features/` → `features/*/components/`
   - Из `components/sections/` → оставить только layout компоненты, остальное в `features/` или удалить
   - Из `lib/marketing-mappers.ts` → `features/projects/utils.ts`
   - Из `lib/projects/orientation.ts` → `features/projects/utils.ts`

3. **Colocate route-specific компоненты**:
   - `app/(marketing)/projects/_components/` — `projects-client.tsx`
   - `app/admin/projects/_components/` — админ компоненты для projects
   - Аналогично для других routes

4. **Унифицировать VideoPlayer**:
   - Решить: один `VideoPlayer` или два (`VideoPlayer` + `MuxPlayer`)?
   - Если один — объединить `components/features/VideoPlayer.tsx` и `components/features/mux-player.tsx`

5. **Переместить integrations**:
   - `lib/email/resend.ts` → `lib/integrations/resend/client.ts`
   - `lib/payments/yookassa.ts` → `lib/integrations/yookassa/client.ts`
   - `lib/mux/client.ts` → `lib/integrations/mux/client.ts`

6. **Создать `components/layout/`**:
   - Переместить `Navigation.tsx`, `NavigationWrapper.tsx`, `Footer.tsx`, `UserMenu.tsx`

#### Файлы/папки
- Создать `features/*/`
- Переместить компоненты из `components/features/` и `components/sections/`
- Создать `app/*/_components/` для route-specific компонентов
- Переместить `lib/marketing-mappers.ts`, `lib/projects/orientation.ts`
- Переместить integrations

#### Импорты
- Обновить на `@/features/*` или `@/components/*`
- Убедиться, что `tsconfig.json` paths покрывают новые пути

#### Проверки
- `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`

---

### Batch C — Backend реорганизация

**Цель**: Усилить Clean Architecture без breaking changes API, унифицировать нейминг.

#### Задачи
1. **Создать use cases**:
   - `application/use_cases/projects/` — create, update, delete
   - `application/use_cases/courses/` — create, update
   - `application/use_cases/enrollments/` — process_payment
   - `application/use_cases/payments/` — process_yookassa_webhook

2. **Создать UoW (Unit of Work)**:
   - `application/services/unit_of_work.py` — единый слой транзакций
   - Репозитории не коммитят внутри методов, только через UoW

3. **Создать мапперы**:
   - `interfaces/mappers/` — мапперы между Pydantic схемами и SQLAlchemy моделями

4. **Унифицировать нейминг**:
   - `blog_post.py` → `blog.py` (модель, репозиторий, схема, роутер)
   - `setting.py` → `settings.py` (модель, репозиторий, схема, роутер)
   - `clients.py` (репозиторий) vs `client.py` (модель) — оставить как есть (множественное для коллекций)

5. **Вынести storage**:
   - `infrastructure/integrations/storage_service.py` — управление uploads
   - Роутер `upload.py` использует storage_service

6. **Создать dependencies**:
   - `delivery/api/dependencies.py` — FastAPI dependencies (auth, db, UoW)

7. **Удалить booking модель** (если не используется):
   - Переместить в `_trash` для проверки

#### Файлы/папки
- Создать `application/use_cases/`
- Создать `application/services/unit_of_work.py`
- Создать `interfaces/mappers/`
- Переименовать `blog_post.py` → `blog.py`
- Переименовать `setting.py` → `settings.py`
- Создать `infrastructure/integrations/storage_service.py`
- Создать `delivery/api/dependencies.py`

#### Импорты
- Обновить ссылки на репозитории/схемы после переименований
- Обновить роутеры для использования use cases и UoW

#### Проверки
- `alembic -c backend/alembic.ini upgrade head`
- `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- `ruff check backend/`
- `mypy backend/` (если настроен)

---

### Batch D — Контракт фронт-бэк

**Цель**: Исключить дрейф типов через генерацию TypeScript типов из OpenAPI.

#### Задачи
1. **Настроить генерацию типов**:
   - Добавить `openapi-typescript` в `package.json`
   - Создать скрипт генерации: `npm run generate:types`
   - Скрипт: `openapi-typescript http://localhost:8001/openapi.json -o contracts/generated/api.ts`

2. **Обновить API клиенты**:
   - `lib/api/*.ts` использовать типы из `contracts/generated/api.ts`
   - Удалить ручные интерфейсы, заменить на сгенерированные

3. **CI/CD**:
   - Добавить проверку синхронизации типов в CI (опционально)

#### Файлы/папки
- Создать `contracts/generated/`
- Добавить скрипт в `package.json`
- Обновить `lib/api/*.ts`

#### Импорты
- Перевести `lib/api/*.ts` на типы из `contracts/generated/api.ts`

#### Проверки
- `npm run generate:types`
- `npm run type-check`
- `npm run test`

---

### Batch E — Доказательное удаление мусора

**Цель**: Удалить только подтвержденные кандидаты через soft delete.

#### Задачи
1. **Soft delete**:
   - Переместить кандидатов в `/_trash`
   - Структура `_trash/` повторяет исходную структуру

2. **Проверки**:
   - Frontend: `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`
   - Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - Docker: `docker compose -f docker-compose.dev.yml up --build`

3. **Окончательное удаление**:
   - После подтверждения работоспособности удалить `/_trash`

#### Кандидаты (из AUDIT.md)
- Компоненты: `ShowreelHero.tsx`, `HeroSection.tsx`, `HeroSectionClient.tsx`, и др.
- Page клиенты: `home-client.tsx`, `projects/client.tsx`, и др.
- Lib: `lib/email/resend.ts`
- Backend: `backend/app/infrastructure/db/models/booking.py` (если не используется)
- Пустые директории: `types/`

#### Файлы/папки
- Создать `/_trash/`
- Переместить кандидатов

#### Импорты
- Удалить/обновить устаревшие импорты

#### Проверки
- `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`
- Backend smoke: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Docker: `docker compose -f docker-compose.dev.yml up --build`

---

### Batch F — Унификация скриптов и документации

**Цель**: Убрать дублирование скриптов, обновить документацию.

#### Задачи
1. **Унифицировать скрипты**:
   - Объединить `scripts/create-admin*.sh` → `scripts/create-admin.sh`
   - Удалить `docker-start.sh` (дублирует docker-compose)
   - Обновить `START_SERVER.sh` или удалить

2. **Обновить документацию**:
   - `README.md` — актуализировать структуру, команды
   - `PROJECT_STRUCTURE.md` — обновить под новую структуру
   - `backend/README.md` — обновить

3. **Docker healthchecks**:
   - Добавить healthchecks для backend/frontend (опционально)

#### Файлы/папки
- Удалить дублирующие скрипты
- Обновить `README.md`, `PROJECT_STRUCTURE.md`

#### Импорты
- Не затрагиваем

#### Проверки
- Проверить работу скриптов
- Проверить актуальность документации

---

## Критерии готовности

После завершения всех батчей проект должен соответствовать:

1. ✅ **Frontend build проходит**: `npm run build` без ошибок
2. ✅ **Backend стартует**: `uvicorn app.main:app` без ошибок
3. ✅ **Миграции применимы**: `alembic upgrade head` без ошибок
4. ✅ **Docker поднимается**: `docker compose -f docker-compose.dev.yml up --build` без ошибок
5. ✅ **Нет сломанных импортов**: `npm run type-check`, `mypy backend/` без ошибок
6. ✅ **README актуален**: Структура и команды соответствуют реальности
7. ✅ **Нет дублей/мертвых модулей**: Все файлы используются или удалены
8. ✅ **Структура читаема и масштабируема**: Четкое разделение features, routes, shared

---

## Вопросы перед Этапом 3 (максимум 3)

### Вопрос 1: Источник истины для API
**Что является источником истины для API: FastAPI или Next API routes?**

- **Текущее состояние**: Next API routes частично дублируют логику (contact валидация, payments create)
- **Варианты**:
  - A) FastAPI — основной источник, Next API routes только прокси
  - B) Next API routes — для некоторых эндпоинтов (payments, uploads), FastAPI для остальных
  - C) Оставить как есть (постепенная миграция)

**Рекомендация**: A) FastAPI как основной источник, Next API routes только для edge cases (CORS, прокси файлов)

---

### Вопрос 2: Booking модель
**Нужно ли сохранять `backend/app/infrastructure/db/models/booking.py`?**

- **Текущее состояние**: Модель существует, но нет репозитория/роутера/схемы. Используется только Calendly iframe
- **Варианты**:
  - A) Удалить (используется только Calendly)
  - B) Оставить для будущего функционала
  - C) Переместить в `_trash` для проверки

**Рекомендация**: C) Переместить в `_trash`, если через месяц не используется — удалить

---

### Вопрос 3: Генерация типов из OpenAPI
**Принимаем ли генерацию типов из OpenAPI как обязательный шаг?**

- **Текущее состояние**: Ручные TypeScript интерфейсы в `lib/api/*.ts`
- **Варианты**:
  - A) Да, обязательный шаг (Batch D)
  - B) Нет, оставляем ручные типы
  - C) Опционально, добавить позже

**Рекомендация**: A) Да, обязательный шаг для минимизации дрейфа типов

---

## Порядок выполнения батчей

1. **Batch A** — Инструменты (низкий риск, не ломает проект)
2. **Batch B** — Frontend реорганизация (средний риск, требует проверки импортов)
3. **Batch C** — Backend реорганизация (средний риск, требует проверки API)
4. **Batch D** — Контракт (низкий риск, добавление, не изменение)
5. **Batch E** — Удаление (низкий риск, только удаление неиспользуемого)
6. **Batch F** — Документация (низкий риск, только обновление)

**Важно**: После каждого батча — полная проверка работоспособности проекта.
