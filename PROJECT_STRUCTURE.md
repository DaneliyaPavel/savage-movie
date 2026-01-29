# Структура проекта и технологический стек

## Обзор проекта

**Savage Movie** — веб‑приложение для видеографа и продюсера с публичным портфолио, блогом, онлайн‑курсами, бронированием и админ‑панелью.

---

## Технологический стек

### Frontend

- **Framework**: Next.js 16.1.1 (React 19.2.3)
- **Язык**: TypeScript 5
- **Стилизация**: Tailwind CSS 4, PostCSS
- **UI библиотеки**: Radix UI, Shadcn/UI, Lucide
- **Анимации**: Framer Motion 12.26.2
- **Карусели**: Embla
- **Формы и валидация**: React Hook Form 7.71.1 + Zod 4.3.5
- **Видео**: Mux Player React 3.10.2, Mux Node SDK 12.8.1
- **Тесты**: Vitest + Testing Library

### Backend

- **Framework**: FastAPI 0.115.0
- **Язык**: Python 3
- **Сервер**: Uvicorn 0.32.0 (ASGI)
- **База данных**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0.36 (async) + AsyncPG 0.30.0
- **Миграции**: Alembic 1.14.0
- **Аутентификация**: JWT (python‑jose) + OAuth (Google, Yandex)
- **Валидация**: Pydantic 2.9.2

### Инфраструктура

- Docker + Docker Compose
- Nginx + Let's Encrypt (шаблоны в `infra/`)

### Внешние сервисы

- Mux — видео
- Resend — email
- YooKassa — платежи
- Calendly — бронирование
- OAuth: Google, Yandex

---

## Структура проекта (актуальная)

```text
savage-movie/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # login / register / callback
│   ├── (marketing)/              # публичные страницы
│   │   ├── about/
│   │   ├── blog/
│   │   ├── clients/
│   │   ├── contact/
│   │   ├── courses/
│   │   ├── directors/
│   │   ├── projects/
│   │   └── studio/
│   ├── admin/                    # админ‑панель
│   │   ├── about/
│   │   ├── blog/
│   │   ├── clients/
│   │   ├── courses/
│   │   ├── projects/
│   │   ├── settings/
│   │   └── testimonials/
│   ├── dashboard/                # личный кабинет
│   ├── booking/                  # бронирование
│   ├── api/                      # Next API routes
│   │   ├── auth/session/
│   │   ├── contact/
│   │   ├── payments/
│   │   └── uploads/
│   ├── layout.tsx
│   ├── robots.ts
│   └── sitemap.ts
│
├── components/                   # UI, секции, админ‑компоненты
├── features/                     # Доменные фичи (projects, courses)
├── lib/                          # API клиенты, env, интеграции
│   ├── api/
│   ├── env.ts / env.server.ts
│   ├── integrations/             # mux/resend/yookassa
│   └── payments/ / mux/ / email/
│
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── delivery/             # HTTP слой (роуты)
│   │   ├── application/          # сервисы
│   │   ├── infrastructure/       # БД, интеграции
│   │   └── interfaces/           # Pydantic схемы
│   ├── alembic/
│   ├── scripts/
│   └── uploads/
│
├── infra/                        # Nginx / Let's Encrypt
├── scripts/                      # Docker/backup/ops скрипты
├── public/                       # статика
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## Архитектура (кратко)

### Frontend (Next.js)

- App Router, server components по умолчанию
- Client components — с директивой `"use client"`
- Валидация env: `lib/env.ts` и `lib/env.server.ts`
- Next API routes используются как thin‑bridge для contact/payments/uploads

### Backend (FastAPI)

- Слоистая структура: delivery → application → infrastructure → interfaces
- Асинхронная работа с БД
- Alembic миграции применяются при запуске контейнера

---

## Порты по умолчанию (Docker)

- Frontend: **3000**
- Backend API: **8001** (в контейнере 8000)
- PostgreSQL: **5433** (в контейнере 5432)

---

## Переменные окружения (кратко)

### Frontend (public)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CALENDLY_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_YANDEX_CLIENT_ID`
- `NEXT_PUBLIC_MUX_ENV_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_SHOWREEL_PLAYBACK_ID`

### Frontend (server‑only)
- `API_URL`
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`
- `UPLOAD_DIR`

### Backend
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_ALGORITHM`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`, `YANDEX_REDIRECT_URI`
- `CORS_ORIGINS`, `APP_URL`
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`
- `SEED_ADMIN`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_FORCE_PASSWORD`

Полный список: `.env.example` и `backend/.env.example`.
