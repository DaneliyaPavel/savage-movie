# ARCHITECTURE

## Overview

- **Frontend**: Next.js 16 App Router (`app/`), UI primitives (`components/ui`), shared logic (`lib/`).
- **Backend**: FastAPI (`backend/app`) с базовой слоистой структурой (delivery/application/infrastructure/interfaces).
- **Database**: PostgreSQL 16 + SQLAlchemy (async) + Alembic.
- **Uploads**: файлы хранятся в `backend/uploads`, раздаются через Next API route `/api/uploads`.

## Frontend (Next.js)

- **Entry points**: `app/layout.tsx` (RootLayout), `app/(marketing)/page.tsx` (главная), `app/admin/*`, `app/dashboard/*`.
- **Server Components**: по умолчанию, данные берутся через `lib/api/server.ts`.
- **Client Components**: помечены `use client`, чаще используют `lib/api/client.ts`.
- **API routes (Next)**:
  - `/api/contact` — валидация и проксирование на FastAPI.
  - `/api/payments/create` — создание платежа (YooKassa) на стороне Next.
  - `/api/payments/webhook` — прокси webhook в FastAPI.
  - `/api/auth/session` — синхронизация JWT в HttpOnly cookies.
  - `/api/uploads/[...path]` — отдача файлов из `backend/uploads`.

## Backend (FastAPI)

- **Entry point**: `backend/app/main.py`.
- **Routers**: `backend/app/delivery/api/*`.
- **Schemas (DTO)**: `backend/app/interfaces/schemas/*`.
- **Repositories + ORM**: `backend/app/infrastructure/db/*`.
- **Integrations**: `backend/app/infrastructure/integrations/*` (email, oauth, payments).
- **Auth**: JWT в `backend/app/application/services/auth_service.py`.

## Request Flows

### SSR/Server Components

1. Next Server Component -> `lib/api/server.ts`.
2. `API_URL` (server env) -> FastAPI `/api/*`.
3. Ответ возвращается в рендер.

### Client Components

1. Браузер -> `lib/api/client.ts`.
2. `NEXT_PUBLIC_API_URL` -> FastAPI `/api/*` (CORS обязателен).

### Next API Routes

1. Браузер -> `/api/*` (Next).
2. Next вызывает FastAPI или внешнюю интеграцию.
3. Ответ возвращается пользователю.

## Contracts

- Контракты API дублируются: Pydantic в backend и TS-интерфейсы в `lib/api/*`.
- Общего источника типов нет (риски рассинхронизации).

## Infrastructure

- Docker Compose (`docker-compose*.yml`) поднимает db/backend/frontend.
- Backend стартует с `alembic upgrade head`.
- Frontend использует `API_URL` (server) и `NEXT_PUBLIC_API_URL` (client).

## Notes

- Разделение ответственности между Next API и FastAPI требует явной фиксации (контактная форма, платежи, webhook, uploads).
