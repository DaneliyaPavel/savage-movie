# SAVAGE MOVIE Backend API

FastAPI backend для сайта видеографа и продюсера. Отвечает за CRUD сущностей, аутентификацию, загрузки и webhooks.

## Технологии

- FastAPI
- SQLAlchemy (async) + Alembic
- PostgreSQL
- JWT + OAuth (Google, Yandex)
- YooKassa webhook

## Установка и запуск

### 1) Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### 2) Переменные окружения

Скопируйте `.env.example` и заполните значения:

```bash
cp .env.example .env
```

Ключевые параметры:

- `DB_*` — подключение к базе
- `JWT_SECRET` — секрет для токенов
- `CORS_ORIGINS`, `APP_URL`
- `GOOGLE_*`, `YANDEX_*` — OAuth
- `YOOKASSA_*` — платежи
- `RESEND_API_KEY`, `ADMIN_EMAIL` — email
- `SEED_ADMIN_*` — автосоздание администратора

### 3) Миграции

```bash
alembic -c alembic.ini upgrade head
```

Если база создана старыми SQL‑скриптами и соответствует модели:

```bash
alembic -c alembic.ini stamp head
```

### 4) Запуск

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

В Docker backend доступен на `http://localhost:8001`.

## API документация

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Эндпоинты (основные)

### Аутентификация

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/oauth/google`
- `GET /api/auth/oauth/google/callback`
- `GET /api/auth/oauth/yandex`
- `GET /api/auth/oauth/yandex/callback`

### Проекты

- `GET /api/projects`
- `GET /api/projects/{slug}`
- `POST /api/projects` (admin)
- `PUT /api/projects/{id}` (admin)
- `DELETE /api/projects/{id}` (admin)

### Курсы

- `GET /api/courses`
- `GET /api/courses/{slug}`
- `POST /api/courses` (admin)
- `PUT /api/courses/{id}` (admin)

### Записи на курсы

- `GET /api/enrollments`
- `GET /api/enrollments/{course_id}`
- `POST /api/enrollments`
- `PUT /api/enrollments/{id}/progress`

### Блог

- `GET /api/blog`
- `GET /api/blog/{slug}`
- `POST /api/blog` (admin)
- `PUT /api/blog/{id}` (admin)
- `DELETE /api/blog/{id}` (admin)

### Клиенты / отзывы / настройки

- `GET /api/clients`, `POST /api/clients` (admin)
- `GET /api/testimonials`, `POST /api/testimonials` (admin)
- `GET /api/settings`, `PUT /api/settings` (admin)

### Контакты

- `POST /api/contact`

### Uploads

- `POST /api/upload/image`
- `POST /api/upload/images`
- `POST /api/upload/video`

### Payments (YooKassa)

- `POST /api/payments/yookassa/webhook`

### Sitemap

- `GET /api/sitemap/projects`
- `GET /api/sitemap/courses`

## Авто‑создание администратора

Можно включить при старте backend:

```env
SEED_ADMIN=true
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_password
SEED_ADMIN_FORCE_PASSWORD=false
```

## Деплой на VPS

Полный сценарий: `DEPLOY_VDS.md`.

Коротко:

1. Установить PostgreSQL и Python
2. Настроить env переменные
3. Применить миграции
4. Запустить Uvicorn через systemd
5. Проксировать через Nginx

## Миграции (создание новых)

```bash
alembic -c alembic.ini revision --autogenerate -m "Describe change"
alembic -c alembic.ini upgrade head
```

## Лицензия

Private
