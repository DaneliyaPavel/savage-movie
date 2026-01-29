![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/DaneliyaPavel/savage-movie?utm_source=oss&utm_medium=github&utm_campaign=DaneliyaPavel%2Fsavage-movie&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# SAVAGE MOVIE — сайт видеографа и продюсера

Премиальный сайт‑портфолио с блогом, админ‑панелью, бронированием, продажей онлайн‑курсов и интеграциями (оплата, видео, email, OAuth).
Проект построен на связке **Next.js 16 + FastAPI** и предназначен для реального продакшн‑использования.

## Содержание

- [Возможности](#возможности)
- [Технологии](#технологии)
- [Быстрый старт (Docker)](#быстрый-старт-docker)
- [Локальная разработка без Docker](#локальная-разработка-без-docker)
- [Создание администратора](#создание-администратора)
- [Скрипты и команды](#скрипты-и-команды)
- [Структура проекта](#структура-проекта)
- [Документация](#документация)
- [Лицензия](#лицензия)

## Возможности

- Публичный сайт: главная, проекты, курсы, блог, клиенты, контакты, about, studio, directors
- Видео‑портфолио с Mux и кастомными плеерами
- Бронирование через Calendly
- Продажа курсов и запись на курсы
- Админ‑панель для управления проектами, курсами, клиентами, отзывами и контентом
- OAuth (Google, Yandex) + JWT
- Платежи через YooKassa
- Email‑уведомления через Resend
- Загрузка изображений и видео в `backend/uploads`

## Технологии

### Frontend
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4, Radix UI, Shadcn/UI
- Framer Motion, Embla Carousel
- React Hook Form + Zod

### Backend
- FastAPI + SQLAlchemy (async) + Alembic
- PostgreSQL 16
- JWT + OAuth (Google, Yandex)

### Инфраструктура
- Docker + Docker Compose
- Nginx/Let's Encrypt (см. `infra/`)

## Быстрый старт (Docker)

Рекомендуемый способ для новичка и для продакшн‑повторяемости.

```bash
# 1) Клонировать репозиторий
git clone <repository-url>
cd savage-movie

# 2) Подготовить env
cp .env.example .env
# Откройте .env и при необходимости заполните ключи сервисов

# 3) Запуск
./scripts/init-docker.sh
# или быстрый запуск
./docker-start.sh
```

Доступные адреса после запуска:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs
- Admin: http://localhost:3000/admin

Подробности про Docker: `DOCKER_SETUP.md`.

## Локальная разработка без Docker

### 1) Frontend

```bash
npm install
cp .env.example .env.local
# Обновите NEXT_PUBLIC_API_URL под ваш backend
npm run dev
```

### 2) Backend

```bash
cd backend
pip install -r requirements.txt

# Вариант A: экспорт переменных в окружение
# Вариант B: скопировать backend/.env.example в backend/.env

alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Примечания:
- При локальном backend используйте `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- Для Docker‑backend — `NEXT_PUBLIC_API_URL=http://localhost:8001`.

## Создание администратора

### Способ 1. Через скрипт (Docker)

```bash
./scripts/create-admin.sh admin@example.com your_password
```

### Способ 2. Авто‑создание при старте backend

В `.env`:

```env
SEED_ADMIN=true
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_password
SEED_ADMIN_FORCE_PASSWORD=false
```

После перезапуска backend пользователь будет создан/обновлен автоматически.

## Скрипты и команды

### Frontend (npm)

```bash
npm run dev          # dev сервер
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run test         # Vitest
npm run format       # Prettier
```

### Docker

```bash
./scripts/init-docker.sh   # базовая инициализация
./docker-start.sh          # быстрый старт
./scripts/docker-dev.sh    # меню: restart/rebuild
./up                       # прод‑запуск (см. DEPLOY_VDS.md)
```

### Бэкапы

```bash
./scripts/backup.sh
./scripts/restore.sh backups/<backup_dir>
```

## Структура проекта

```text
savage-movie/
├── app/                  # Next.js App Router (маршруты)
├── components/           # UI/sections/admin компоненты
├── features/             # Доменные фичи (projects/courses)
├── lib/                  # API клиенты, интеграции, env
├── backend/              # FastAPI + Alembic + SQLAlchemy
├── infra/                # Nginx/Let's Encrypt
├── scripts/              # Docker/backup/ops скрипты
├── public/               # Статика
└── docker-compose.yml
```

Подробная структура: `PROJECT_STRUCTURE.md`.

## Документация

- `DOCKER_SETUP.md` — Docker‑развертывание
- `DEPLOY_VDS.md` — деплой на VDS
- `backend/README.md` — backend API и деплой
- `ARCHITECTURE.md` — архитектура и потоки запросов
- `PROJECT_STRUCTURE.md` — структура проекта
- `MIGRATION_INSTRUCTIONS.md` — Alembic миграции
- `UPLOAD_GUIDE.md` — загрузка файлов
- `DATA_RECOVERY_GUIDE.md` — восстановление данных

## Лицензия

Private (все права защищены)
