<a id="readme"></a>

<div align="center">

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/DaneliyaPavel/savage-movie?utm_source=oss&utm_medium=github&utm_campaign=DaneliyaPavel%2Fsavage-movie&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# SAVAGE MOVIE
### Премиальный сайт‑портфолио видеографа и продюсера

Публичный сайт + блог + курсы + бронирование + админ‑панель + платежи + интеграции.
<br/>
**Stack:** Next.js 16 + FastAPI + PostgreSQL + Docker

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-Private-555555?style=flat" alt="License: Private" />
</p>

<p align="center">
  <a href="https://github.com/DaneliyaPavel/savage-movie/actions/workflows/deploy.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/DaneliyaPavel/savage-movie/deploy.yml?label=CI&branch=main" alt="CI status" />
  </a>
  <img src="https://img.shields.io/badge/tests-not_configured-lightgrey" alt="Tests status" />
  <img src="https://img.shields.io/badge/vercel-not_configured-black" alt="Vercel status" />
  <a href="https://github.com/DaneliyaPavel/savage-movie/actions/workflows/deploy.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/DaneliyaPavel/savage-movie/deploy.yml?label=Docker%20build&branch=main" alt="Docker build status" />
  </a>
  <img src="https://img.shields.io/badge/ghcr.io-savage--movie--backend-latest-2ea44f" alt="GHCR backend" />
  <img src="https://img.shields.io/badge/ghcr.io-savage--movie--frontend-latest-2ea44f" alt="GHCR frontend" />
</p>

</div>

---

<div align="center">
  <table>
    <tr>
      <td align="center"><b>README</b></td>
      <td align="center"><a href="DOCKER_SETUP.md">Docker</a></td>
      <td align="center"><a href="DEPLOY_VDS.md">Deploy VDS</a></td>
      <td align="center"><a href="backend/README.md">Backend API</a></td>
      <td align="center"><a href="ARCHITECTURE.md">Architecture</a></td>
      <td align="center"><a href="PROJECT_STRUCTURE.md">Structure</a></td>
      <td align="center"><a href="MIGRATION_INSTRUCTIONS.md">Migrations</a></td>
      <td align="center"><a href="UPLOAD_GUIDE.md">Uploads</a></td>
      <td align="center"><a href="DATA_RECOVERY_GUIDE.md">Recovery</a></td>
    </tr>
  </table>
</div>

---

## ✨ Что внутри

<table>
  <tr>
    <td>🎬 Видео‑портфолио</td>
    <td>Проекты с Mux и кастомными плеерами</td>
  </tr>
  <tr>
    <td>🧠 Курсы</td>
    <td>Покупка, прогресс, просмотр уроков</td>
  </tr>
  <tr>
    <td>📅 Бронирование</td>
    <td>Calendly для записи на услуги</td>
  </tr>
  <tr>
    <td>🧩 Админ‑панель</td>
    <td>CRUD для проектов, курсов, клиентов, отзывов</td>
  </tr>
  <tr>
    <td>💳 Оплата</td>
    <td>YooKassa + webhook обработка</td>
  </tr>
  <tr>
    <td>🔐 Аутентификация</td>
    <td>JWT + OAuth (Google, Yandex)</td>
  </tr>
</table>

---

## 🎞️ Превью

<table>
  <tr>
    <td><img src="docs/assets/preview-home.svg" alt="Preview: Home" /></td>
    <td><img src="docs/assets/preview-projects.svg" alt="Preview: Projects" /></td>
  </tr>
  <tr>
    <td colspan="2"><img src="docs/assets/preview-admin.svg" alt="Preview: Admin" /></td>
  </tr>
</table>

> Замените изображения в `docs/assets/` на реальные скриншоты, сохранив имена файлов.

---

## 🚀 Быстрый старт

### Вариант A — Docker (рекомендуется)

```bash
# 1) Клонировать репозиторий
git clone <repository-url>
cd savage-movie

# 2) Подготовить env
cp .env.example .env

# 3) Запуск
./scripts/init-docker.sh
# или быстрый запуск
./docker-start.sh
```

### Вариант B — Локально без Docker

```bash
# Frontend
npm install
cp .env.example .env.local
npm run dev

# Backend
cd backend
pip install -r requirements.txt
alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Адреса после запуска (Docker):**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs
- Admin: http://localhost:3000/admin

**Если backend запущен локально без Docker:** `http://localhost:8000` и `http://localhost:8000/docs`

---

## 🧭 Навигация по проекту

```text
savage-movie/
├── app/                  # Next.js App Router (маршруты)
├── components/           # UI/sections/admin компоненты
├── features/             # Доменные фичи (projects/courses)
├── lib/                  # API клиенты, интеграции, env
├── backend/              # FastAPI + Alembic + SQLAlchemy
├── infra/                # Nginx/Let's Encrypt
├── scripts/              # Docker/backup/ops скрипты
└── docker-compose.yml
```

Подробная структура: `PROJECT_STRUCTURE.md`.

---

## 🔐 Создание администратора

```bash
./scripts/create-admin.sh admin@example.com your_password
```

Альтернатива — auto‑seed через `.env`:

```env
SEED_ADMIN=true
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_password
SEED_ADMIN_FORCE_PASSWORD=false
```

---

## 🧪 Скрипты и команды

<details>
  <summary><b>Frontend (npm)</b></summary>

```bash
npm run dev          # dev сервер
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run test         # Vitest
npm run format       # Prettier
```
</details>

<details>
  <summary><b>Docker</b></summary>

```bash
./scripts/init-docker.sh   # базовая инициализация
./docker-start.sh          # быстрый старт
./scripts/docker-dev.sh    # меню: restart/rebuild
./up                       # прод‑запуск (см. DEPLOY_VDS.md)
```
</details>

<details>
  <summary><b>Бэкапы</b></summary>

```bash
./scripts/backup.sh
./scripts/restore.sh backups/<backup_dir>
```
</details>

---

## 🧩 Технологии

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Shadcn/UI, Framer Motion, Embla, Zod

**Backend:** FastAPI, SQLAlchemy (async), Alembic, PostgreSQL

**Интеграции:** YooKassa, Mux, Resend, Calendly, OAuth Google/Yandex

---

## 📚 Документация

- `DOCKER_SETUP.md` — Docker‑развертывание
- `DEPLOY_VDS.md` — деплой на VDS
- `backend/README.md` — backend API и деплой
- `ARCHITECTURE.md` — архитектура и потоки запросов
- `PROJECT_STRUCTURE.md` — структура проекта
- `MIGRATION_INSTRUCTIONS.md` — Alembic миграции
- `UPLOAD_GUIDE.md` — загрузка файлов
- `DATA_RECOVERY_GUIDE.md` — восстановление данных

---

## 📄 Лицензия

Private (все права защищены)
