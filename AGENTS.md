# Project overview

Savage Movie — премиальный сайт‑портфолио видеографа и продюсера с публичным контентом, блогом, онлайн‑курсами, бронированием, админ‑панелью и платежами. Проект состоит из Next.js фронтенда и FastAPI бэкенда с PostgreSQL, интеграциями (Mux, YooKassa, Resend, OAuth) и загрузками файлов. Основные entrypoints: Next.js App Router в `app/` (RootLayout `app/layout.tsx` и маршруты `app/(marketing)/*`), Next API routes в `app/api/*`, FastAPI приложение в `backend/app/main.py`. Для локального и контейнерного запуска используются `docker-compose.yml`, `./scripts/init-docker.sh` и `./docker-start.sh`.

## Tech stack

Languages and runtimes:
- TypeScript 5, React 19, Next.js 16.1.1.
- Python 3.11 (mypy config) + FastAPI 0.115.0.
- PostgreSQL 16.

Frontend:
- Next.js App Router, Tailwind CSS 4, PostCSS.
- UI: Radix UI, Shadcn/UI, Lucide.
- Forms/validation: React Hook Form + Zod.
- Animations: Framer Motion.
- Tests: Vitest + Testing Library.

Backend:
- FastAPI + Uvicorn.
- SQLAlchemy 2 (async) + asyncpg, Alembic migrations.
- Pydantic v2, python‑jose, passlib, httpx.

Integrations:
- Mux (video), YooKassa (payments), Resend (email), OAuth Google/Yandex, Calendly.

## Directory structure & architecture

Key directories:
- `app/` — Next.js App Router (маршруты, layouts, server/client components, Next API routes в `app/api/*`).
- `components/` — UI/sections/admin компоненты.
- `features/` — доменные фичи (projects/courses и др.).
- `lib/` — API клиенты и утилиты, интеграции, env.
- `backend/app/` — FastAPI приложение с слоями delivery/application/infrastructure/interfaces.
- `backend/alembic/` — Alembic миграции и версии.
- `backend/uploads/` — загруженные файлы.
- `infra/` — Nginx/Let's Encrypt шаблоны и инфраструктурные файлы.
- `scripts/` — Docker/backup/ops скрипты.
- `public/` — статика.
- `docs/` — документация и превью.

Where to find key logic:
- API роуты FastAPI: `backend/app/delivery/api/`.
- Pydantic схемы (DTO): `backend/app/interfaces/schemas/`.
- Бизнес‑логика/сервисы: `backend/app/application/services/`.
- ORM модели и репозитории: `backend/app/infrastructure/db/models/` и `backend/app/infrastructure/db/repositories/`.
- Интеграции (email/oauth/payments): `backend/app/infrastructure/integrations/`.
- Next API routes: `app/api/` (contact/payments/uploads/auth/session).
- API клиенты фронтенда: `lib/api/` с разделением `lib/api/server.ts` и `lib/api/client.ts`.
- Env валидация: `lib/env.ts` и `lib/env.server.ts`.

Architecture notes:
- Frontend по умолчанию server components, client components только с `"use client"`.
- Слоистая архитектура backend: delivery → application → infrastructure → interfaces.
- Контракты API дублируются: Pydantic в backend и TS‑интерфейсы в `lib/api/*`.

## Setup & dev commands

Frontend (локально):
- `npm install`
- `cp .env.example .env.local`
- `npm run dev`

Backend (локально):
- `cd backend`
- `pip install -r requirements.txt`
- `cp .env.example .env`
- `alembic -c alembic.ini upgrade head`
- `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

Docker (рекомендуется):
- `./scripts/init-docker.sh`
- `./docker-start.sh`
- `./scripts/docker-dev.sh` (меню restart/rebuild)

Admin user:
- `./scripts/create-admin.sh admin@example.com your_password`

Default ports (Docker):
- Frontend: `3000`
- Backend API: `8001` (в контейнере `8000`)
- PostgreSQL: `5433` (в контейнере `5432`)

## Build & test commands

Frontend build/run:
- `npm run build`
- `npm run start`

Frontend tests and quality:
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run lint`
- `npm run type-check`
- `npm run format`
- `npm run format:check`

Backend tests and quality:
- Явных команд в репозитории нет; ниже предложения.
- Предложение, требует подтверждения: `cd backend && pytest` (pytest.ini ожидает `backend/tests`).
- Предложение, требует подтверждения: `cd backend && ruff check .` (ruff указан в `backend/requirements-dev.txt`).
- Предложение, требует подтверждения: `cd backend && mypy app` (mypy конфиг в `backend/mypy.ini`).

### What agents should run by default before completing tasks

If only frontend code changes:
- `npm run lint`
- `npm run type-check`
- `npm run test`

If backend code changes:
- Предложение, требует подтверждения: `cd backend && pytest`.
- Предложение, требует подтверждения: `cd backend && ruff check .`.
- Предложение, требует подтверждения: `cd backend && mypy app`.

If both sides change, run both sets.

## Code style & conventions

Frontend:
- Пиши новый код на TypeScript (TS/TSX); JS допускается компилятором, но не предпочтителен.
- Strict TypeScript включён (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`).
- ESLint конфиг основан на Next core‑web‑vitals и TypeScript (`eslint.config.mjs`).
- Prettier: без `;`, одинарные кавычки, `printWidth: 100` (`.prettierrc`).
- Используй alias `@/*` из `tsconfig.json`.
- Server Components по умолчанию; client components только при необходимости с `"use client"`.

Backend:
- Асинхронный SQLAlchemy и `AsyncSessionLocal` (`backend/app/infrastructure/db/session.py`).
- Pydantic v2 схемы в `backend/app/interfaces/schemas/`.
- Роуты не содержат бизнес‑логики: логика в `backend/app/application/services/`.
- Интеграции вынесены в `backend/app/infrastructure/integrations/`.

## Testing requirements

- Любые изменения бизнес‑логики должны сопровождаться тестами там, где есть тестовая инфраструктура.
- Frontend: тесты в `lib/utils/__tests__/` исполняются через Vitest.
- Backend: тестовой папки `backend/tests` сейчас нет, но `backend/pytest.ini` её ожидает.
- Предложение, требует подтверждения: создать `backend/tests` и добавлять pytest‑тесты при изменении backend‑логики.

## Security & data protection

- Не логировать и не коммитить чувствительные данные: пароли, токены, JWT секреты, OAuth секреты, YooKassa ключи, Mux токены, Resend ключи.
- Все секреты только через `.env.example` и `backend/.env.example`, реальные значения держать в `.env`/`.env.local`.
- Не менять CORS, auth или платежные настройки без явного запроса.
- Uploads хранятся в `backend/uploads`; не добавлять реальные медиа в репозиторий.

## Git workflow & conventions

- Ветка для работы должна начинаться с `codex/`.
- Коммиты по Conventional Commits, на русском и в прошедшем времени. Пример: `fix(ui): исправил отображение шапки`.
- Один коммит = одна задача. Если правок много, дробить по смыслу.
- PR оформлять на русском в прошедшем времени и с понятным результатом.

## AI agent guidelines

- Всегда читать `AGENTS.md` перед началом работы.
- Перед крупным рефакторингом или изменением API сначала предложить план и согласовать с пользователем.
- Не удалять/перемещать файлы и не ломать публичные API без явного подтверждения.
- После изменений запускать указанные проверки и не считать задачу завершённой, пока они не зелёные.
- При сомнениях или нехватке данных о требованиях остановиться и задать уточняющие вопросы.
