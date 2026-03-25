# CLAUDE.md — Savage Movie

## Project Overview

Premium portfolio website for a videographer/producer. Full-stack app with video portfolio, online courses, booking, blog, admin panel, and payments. Bilingual (Russian/English).

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/UI + Radix UI
**Backend:** FastAPI, SQLAlchemy 2 (async), PostgreSQL 16, Alembic migrations
**Infra:** Docker Compose, Nginx, GitHub Actions CI/CD, VDS deployment

**Key integrations:** Bunny Stream (video), YooKassa (payments), Resend (email), Calendly (booking), Google/Yandex OAuth

## Commands

```bash
# Frontend
npm run dev          # Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run type-check   # tsc --noEmit
npm test             # Vitest

# Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
alembic upgrade head                          # Run migrations
alembic revision --autogenerate -m "desc"     # Create migration

# Docker
npm run docker:dev   # Interactive Docker menu
./scripts/init-docker.sh  # First-time setup
```

## Project Structure

```
app/                    # Next.js App Router pages
  (auth)/               # Login, register, OAuth callbacks
  (marketing)/          # Public pages (about, blog, clients, courses, projects, etc.)
  admin/                # Admin CRUD dashboard
  dashboard/            # User dashboard
  api/                  # Next.js API routes (session, payments, uploads, contact)

components/             # React components
  ui/                   # Base Shadcn/Radix components (card, tabs, accordion, etc.)
  sections/             # Page sections
  admin/                # Admin panel components
  features/             # Feature-specific components
  providers/            # Context providers

features/               # Domain modules (each has api.ts, mappers.ts, components/)
  projects/
  courses/

lib/                    # Shared utilities
  api/                  # API clients (client.ts, server.ts, base.ts + domain files)
  integrations/         # Bunny Stream, YooKassa, Resend SDKs
  env.ts                # Public env validation (Zod)
  env.server.ts         # Server-only env validation
  utils/                # cn(), logger, slugify

backend/                # FastAPI backend (Python)
  app/
    delivery/api/       # HTTP route handlers
    application/services/  # Business logic
    infrastructure/     # DB models, repositories, integrations
    interfaces/schemas/ # Pydantic DTOs
  alembic/              # Database migrations

infra/                  # Nginx configs, TLS
scripts/                # Docker, deploy, backup, admin scripts
```

## Architecture & Patterns

- **Server Components by default**, `"use client"` only when needed
- **Feature module pattern:** `features/MODULE/{api.ts, mappers.ts, utils.ts, components/}`
- **API clients split:** `lib/api/client.ts` (browser, uses `NEXT_PUBLIC_API_URL`) vs `lib/api/server.ts` (SSR, uses `API_URL`, dynamically imported)
- **Mappers transform** API responses to UI models (e.g., `ApiProject` → `MarketingProject`)
- **Backend layered architecture:** delivery (routes) → application (services) → infrastructure (repositories, DB)
- **i18n via DB fields:** `title_ru`/`title_en`, mapped in frontend mappers
- **Auth:** JWT in HttpOnly cookie via `/api/auth/session`, OAuth callbacks through FastAPI
- **Payments:** Frontend → Next.js API route → YooKassa SDK; webhooks proxied to FastAPI

## Coding Conventions

- **No semicolons**, single quotes, trailing commas (es5), 100 char line width
- **Path alias:** `@/*` maps to project root
- **Import order:** external packages → `@/` absolute → `./` relative
- **Components:** PascalCase files and exports. Shadcn compound exports pattern: `export { Card, CardHeader, CardTitle, CardContent }`
- **Functions/variables:** camelCase
- **Files:** kebab-case (e.g., `premium-fullscreen-player.tsx`)
- **Styling:** Tailwind utilities + `cn()` helper (clsx + tailwind-merge) + CVA for variants
- **Forms:** React Hook Form + Zod schemas + `@hookform/resolvers`
- **Data attributes:** Components use `data-slot` for styling hooks
- **TypeScript:** Strict mode, no unused locals/parameters
- **Backend Python:** PascalCase models, snake_case everything else, Pydantic for validation

## Environment Variables

Public (client-safe): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BUNNY_CDN_HOSTNAME`, `NEXT_PUBLIC_SHOWREEL_VIDEO_ID`, `NEXT_PUBLIC_CALENDLY_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_YANDEX_CLIENT_ID`

Server-only: `API_URL`, `JWT_SECRET`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_CDN_HOSTNAME`, `YOOKASSA_*`, `RESEND_API_KEY`, `GOOGLE_CLIENT_SECRET`, `YANDEX_CLIENT_SECRET`, DB credentials

Validated at startup via Zod schemas in `lib/env.ts` and `lib/env.server.ts`.

## Testing

- **Vitest** with jsdom, globals enabled, `@/` path alias
- Tests in `__tests__/` directories alongside source
- Coverage via v8 provider
