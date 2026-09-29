# CLAUDE.md — Savage Movie

> **Сначала прочитай [docs/context/STATUS.md](docs/context/STATUS.md)**, затем [docs/context/DECISIONS.md](docs/context/DECISIONS.md). Код, CMS или старый документ не являются product/business truth, если есть более новое решение владельца. `docs/archive/` — не источник истины.

## Что это

savagemovie.ru — **живой production** и основной коммерческий digital-актив **Savage Movie**: production-студии (рекламные ролики, имиджевое видео, fashion/beauty, digital, корпоративное видео, клипы, AI/hybrid production). СПб + Москва + Россия. Не портфолио одного видеографа. Savage Academy (курсы) — связанный, но отдельный продукт; не смешивать без прямого запроса. Основной язык — русский.

## Production safety (обязательно)

Без явной задачи владельца **нельзя**: менять `main`, commit/push/merge, deploy, запускать prod-миграции, трогать DNS/nginx/secrets, auth/payments, формы, аналитику, CRM/n8n, lead capture, удалять prod-данные. Работа: исследование → диагноз → план → ветка → изменение → проверки → отчёт. PR — draft, без merge. Push в `main` = автодеплой на VDS без тестов.

## Стек (проверено по репозиторию)

Next.js 16, React 19, TypeScript 5, Tailwind 4, shadcn/Radix, Framer Motion · FastAPI, SQLAlchemy 2 async, PostgreSQL 16, Alembic · Docker Compose, nginx, GitHub Actions → GHCR → VDS.
Интеграции: **Bunny Stream** (видео, HLS; не Mux; поля БД `mux_playback_id` хранят Bunny id), YooKassa (курсы), Resend/SMTP (почта), Telegram (через реле), **n8n webhook** (лиды), **Яндекс.Метрика 108213944**, Google/Yandex OAuth. Calendly **не используется** (`/booking` — заявка на созвон).

## Ключевые механики

- **Лиды:** бриф `/api/estimate` (лендинг `/reklamny-rolik`, `/services`) → email/SMTP + Telegram + n8n, атрибуция (utm, yclid, ClientID); цель Метрики `production_lead_success` — единственная конверсия. `/api/contact` — старый путь (`/contact`, `/booking`).
- **CMS priority:** контент `/reklamny-rolik` лежит в settings (`commercial_landing`) и **перекрывает** дефолты `lib/commercial-landing/content.ts` (`merge.ts` заменяет массивы целиком). Правка кода не меняет live.
- **nginx:** каждый новый Next-роут `app/api/*` обязан иметь `location` в `infra/nginx/conf.d/default.conf`, иначе `/api/` уйдёт в FastAPI и вернёт 404 (тест `infra/nginx/__tests__`).
- **Canonical** задаётся только на маршруте, не в root layout (тест `app/__tests__/canonical-architecture.test.ts`).
- Миграции Alembic выполняются на старте backend-контейнера — деплой = потенциальная prod-миграция.
- Backend-код на проде монтируется из git-чекаута поверх образа.

## Команды

```bash
npm run dev | build | lint | lint:fix | type-check | test | format:check
cd backend && uvicorn app.main:app --reload --port 8000
cd backend && alembic upgrade head          # только локально
./scripts/init-docker.sh                    # первый запуск (Docker)
```

Перед завершением frontend-задачи: `npm run lint && npm run type-check && npm test`. Backend-тестов (`backend/tests`) нет.

## Структура

`app/` (App Router: `(marketing)`, `admin`, `dashboard`, `api`) · `components/{ui,sections,features,admin}` · `features/{projects,courses,clients}` · `lib/{api,integrations,commercial-landing,services,analytics}` · `backend/app/{delivery,application,infrastructure,interfaces}` · `infra/nginx` · `scripts/` · `docs/{context,archive}`.
Server Components по умолчанию; `lib/api/client.ts` (браузер) vs `lib/api/server.ts` (SSR); мапперы API → UI; i18n через `title_ru/title_en` и `lib/i18n-context.tsx`.

## Конвенции

Без `;`, одинарные кавычки, trailing comma es5, 100 символов; alias `@/*`; файлы kebab-case, компоненты PascalCase; Tailwind + `cn()` + CVA; формы RHF + Zod; strict TS без неиспользуемого. Коммиты — Conventional Commits на русском. Не выдумывать клиентов, кейсы, награды, результаты, адреса, отзывы, SLA.

## Бренд и тон

Бренд определяется по production и main (см. [BRAND.md](docs/context/BRAND.md)); Brand OS/Brandbook/Design Tokens v2 не используются. Тон: коротко, конкретно, уверенно, без агентских клише и лишних англицизмов. Новые страницы строить в «монтажном» языке `/services`, `/clients`, `/reklamny-rolik` ([DESIGN_SYSTEM.md](docs/context/DESIGN_SYSTEM.md)).

## Env

Публичные: `NEXT_PUBLIC_{API_URL,APP_URL,BUNNY_CDN_HOSTNAME,SHOWREEL_VIDEO_ID,GOOGLE_CLIENT_ID,YANDEX_CLIENT_ID}`. Серверные: `API_URL`, `JWT_SECRET`, `BUNNY_STREAM_*`, `YOOKASSA_*`, `RESEND_API_KEY`, `SMTP_*`, `TELEGRAM_*`, `LEAD_WEBHOOK_URL/TOKEN`, `ADMIN_EMAIL`, БД. Валидация: `lib/env.ts`, `lib/env.server.ts`. Секреты не логировать и не коммитить.
