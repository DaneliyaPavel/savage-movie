# TECH — фактическая архитектура

Связанное: [STATUS](STATUS.md), [DECISIONS](DECISIONS.md) (D-05 production-safety). Старые `ARCHITECTURE.md`/`PROJECT_STRUCTURE.md` не заменяют этот файл.

## Стек (package.json / requirements.txt, main)
Next.js 16.1 · React 19 · TS 5 · Tailwind 4 · Framer Motion · hls.js · RHF+Zod · Vitest (27 тест-файлов). Backend: FastAPI 0.137, SQLAlchemy 2 async, asyncpg, Alembic (10 миграций), slowapi. Postgres 16.
**Видео: Bunny Stream (b-cdn.net), НЕ Mux.** README/AGENTS/PROJECT_STRUCTURE/`.env.example` (`MUX_*`) устарели. Остаток: поля БД `mux_playback_id` (фактически Bunny video id), файлы `mux-player.tsx`, `NEXT_PUBLIC_MUX_ENV_KEY` в .env.example.
Аналитика: **Яндекс.Метрика 108213944** (webvisor, clickmap) захардкожена в `components/analytics/yandex-metrika.tsx`; GA заведён в env, но **не используется** в коде.

## Поток запроса
Browser → nginx (443) → `/` и Next-роуты → `frontend:3000` (Next standalone); `/api/*` → `backend:8000` (FastAPI) кроме явных: `/api/contact`, `/api/subscribe`, `/api/estimate`, `/api/auth/session`, `/api/payments/`, `/api/uploads/` → Next. `/uploads/` → Next (rewrite → `/api/uploads`, volume `backend/uploads` ro). `/cdn/` → Bunny (обход блокировок b-cdn.net). Next SSR → `API_URL=http://backend:8000`.
`/media/` → статика nginx из тома `/var/www/savage-media` (Range/206, `immutable` на год), при отсутствии файла — Next (`public/media`). Там лежат постеры и короткие MP4 первого экрана; полные фильмы остаются на Bunny HLS через `/cdn/`.
Расхождение: `app/api/auth/refresh` и `app/api/admin/revalidate` существуют в Next, но nginx отдаёт их FastAPI (зафиксировано в тесте как `SERVED_BY_BACKEND`); revalidate из админки, вероятно, не работает через Next (**UNVERIFIED**).

## Медиа-слой (постер → видео)
Резкий постер приходит в HTML, MP4-превью фиксированного качества стартует загрузчиком из `<head>` до гидратации и проявляется поверх постера, когда показан движущийся кадр и хватает буфера. Один hls.js-контроллер на весь сайт (`lib/media/hls-controller.ts`). Файлы собирает `scripts/media/build-web-video.mjs` вне VDS. Подробно: [docs/media-pipeline.md](../media-pipeline.md).

## Формы и лиды
- `/api/estimate` (бриф `/reklamny-rolik` и `/services`): honeypot, rate-limit 5/ч (in-memory), дедуп 10 мин, атрибуция (utm, yclid, gclid, ClientID, first-touch), файл брифа в `/uploads/briefs`, доставка: SMTP/Resend + Telegram + n8n (`LEAD_WEBHOOK_URL`, prod `n8n.savagemovie.ru:8444`). Успех = доставлено хотя бы в один канал.
- `/api/contact` (`/contact`, `/booking`): email + Telegram, без n8n и без атрибуции.
- `/api/subscribe`: рассылка в футере.
- `scripts/check-contact-delivery.sh` — диагностика доставки.

## Деплой (цепочка)
push/merge в **main** → GitHub Actions `deploy.yml` (нет lint/test/type-check) → docker buildx: backend+frontend → GHCR `:latest` (NEXT_PUBLIC_* как build-args из secrets) → SSH на VDS (`VDS_PATH`) → `scripts/deploy.sh main --force`: `git reset --hard origin/main`, `docker compose pull`, `up -d --remove-orphans --no-build`, `restart nginx`, `image prune`.
- **Миграции:** автоматически на старте backend-контейнера (`alembic upgrade head`) — то есть каждый деплой = потенциальная prod-миграция без отдельного шага.
- **Backend-код на проде монтируется из git-чекаута** (`./backend:/app/backend` перекрывает образ) — образ и код могут разойтись.
- **Health:** backend `GET /health` (docker healthcheck); frontend healthcheck нет; deploy.sh не ждёт здоровья и не проверяет.
- **Rollback:** формального нет: тег только `latest`; откат = revert-коммит в main (новая сборка) либо ручной `IMAGE_TAG`. Бэкапы БД: `scripts/backup.sh` (расписание **UNVERIFIED**).
- **nginx:** `infra/nginx/conf.d/default.conf` (монтируется, restart при деплое; TLS Let's Encrypt с хоста; www→non-www; HSTS; HTTP/2 через `http2 on;` в блоках savagemovie.ru, www и ai, нужен nginx ≥ 1.25.1, образ `nginx:alpine` плавающий; HTTP/3 и Alt-Svc нет). Отдельный security.yml: npm audit, pip-audit, gitleaks, trivy (не блокирует deploy — отдельный workflow).
- Порт VDS/IP и `VDS_PATH` есть в DEPLOY_VDS.md (устаревшие http://IP примеры).

## Опасные зоны (не трогать без прямого разрешения)
`.github/workflows/deploy.yml`, `scripts/deploy.sh`, `infra/nginx/*`, `docker-compose.yml`, `backend/alembic/versions/*`, `app/api/payments/*`, `backend/.../auth*`, `app/api/estimate|contact` (лиды), `components/analytics/*` + `lib/analytics/metrika.ts` (цели), `lib/commercial-landing/merge.ts` (CMS-приоритет), sitemap/robots/canonical (тест-стражи).

## Качество
Frontend-тесты есть (Vitest); backend `tests/` **нет** (pytest.ini ждёт). Тесты/lint/type-check в этом аудите **не запускались** (нет node_modules, read-only аудит). Дубли/мёртвый код — см. DESIGN_SYSTEM.md.
