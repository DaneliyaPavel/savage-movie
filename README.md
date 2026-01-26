![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/DaneliyaPavel/savage-movie?utm_source=oss&utm_medium=github&utm_campaign=DaneliyaPavel%2Fsavage-movie&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# SAVAGE MOVIE - Сайт видеографа и продюсера

Премиальный сайт-портфолио для видеографа и продюсера с функциями бронирования услуг и продажи онлайн-курсов.

## Технологии

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Animations**: Framer Motion
- **Backend**: Python FastAPI + PostgreSQL
- **Authentication**: JWT + OAuth (Google, Yandex)
- **Payments**: ЮKassa
- **Booking**: Calendly
- **Video**: Mux
- **Email**: Resend
- **Forms**: React Hook Form + Zod

## Быстрый старт

### Вариант 1: Docker (Рекомендуется)

Самый быстрый способ запустить весь проект:

```bash
# 1. Клонируйте репозиторий
git clone <repository-url>
cd savage-movie

# 2. Запустите скрипт инициализации (использует переменные окружения и запустит контейнеры)
./scripts/init-docker.sh

# Или запустите вручную
./docker-start.sh dev
```

Подождите 30-60 секунд, пока все контейнеры запустятся. Проверьте статус:

```bash
docker-compose -f docker-compose.dev.yml ps
```

Проект будет доступен:

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8001>
- **API Docs**: <http://localhost:8001/docs>
- **Admin Panel**: <http://localhost:3000/admin>

**Подробная инструкция по Docker:** см. [DOCKER_SETUP.md](DOCKER_SETUP.md)

### Вариант 2: Локальная установка

1. Клонируйте репозиторий:

```bash
git clone <repository-url>
cd savage-movie
```

2. Установите зависимости:

```bash
npm install
```

3. При необходимости задайте переменные окружения (см. `.env.example`).
Для фронтенда можно использовать локальный файл:

```bash
cp .env.example .env.local
```

4. Заполните переменные окружения (см. раздел "Настройка переменных окружения" ниже)

5. Настройте Python Backend:

```bash
cd backend
pip install -r requirements.txt
# Переменные окружения задаются через окружение (см. backend/.env.example)
# Создайте БД PostgreSQL и примените миграции Alembic
alembic -c alembic.ini upgrade head
# Если база уже создана SQL-скриптами:
# alembic -c alembic.ini stamp head
# Запустите API сервер
uvicorn app.main:app --reload --port 8000
```

6. Запустите Next.js dev сервер:

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Создание первого администратора

Для входа в админ-панель нужно создать пользователя с ролью `admin`.

### Самый простой способ: Используйте скрипт

```bash
./scripts/create-admin.sh admin@example.com your_password
```

Этот скрипт автоматически создаст администратора с указанным email и паролем.

### Альтернативный способ: Через API + обновление роли

```bash
# 1. Зарегистрируйтесь через API
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_secure_password",
    "full_name": "Admin User"
  }'

# 2. Обновите роль на admin в БД
docker exec -it savage_movie_db_dev psql -U postgres -d savage_movie -c \
  "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';"
```

После создания администратора:

1. Перейдите на <http://localhost:3000/login>
2. Введите email и пароль администратора
3. После входа вы будете перенаправлены на `/admin`

## Настройка переменных окружения

### Frontend (переменные окружения)

Используйте `.env.example` как список необходимых переменных.
Для локальной разработки можно создать `.env.local` в корне проекта:

```env
# Python API
NEXT_PUBLIC_API_URL=http://localhost:8000

# OAuth (для frontend redirects)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_YANDEX_CLIENT_ID=your_yandex_client_id

# ЮKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Calendly
NEXT_PUBLIC_CALENDLY_URL=your_calendly_url

# Mux
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
NEXT_PUBLIC_MUX_ENV_KEY=your_mux_env_key

# Resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@savagemovie.ru
ADMIN_EMAIL=savage.movie@yandex.ru

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (переменные окружения)

Список переменных — в `backend/.env.example`. Задавайте их через окружение
или используйте локальный способ (Docker Compose, export и т.д.).

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=savage_movie
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/oauth/google/callback

# OAuth Yandex
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
YANDEX_REDIRECT_URI=http://localhost:8000/api/auth/oauth/yandex/callback

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Email
RESEND_API_KEY=your_resend_key
ADMIN_EMAIL=savage.movie@yandex.ru

# App URL
APP_URL=http://localhost:3000
```

### Инструкции по получению ключей

#### OAuth Google

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID
5. Добавьте authorized redirect URI: `http://localhost:8000/api/auth/oauth/google/callback`
6. Скопируйте Client ID и Client Secret

#### OAuth Yandex

1. Перейдите в [Yandex OAuth](https://oauth.yandex.ru/)
2. Создайте новое приложение
3. Добавьте redirect URI: `http://localhost:8000/api/auth/oauth/yandex/callback`
4. Скопируйте Client ID и Client Secret

#### ЮKassa

1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Создайте магазин
3. Получите Shop ID и Secret Key в настройках магазина

#### Calendly

1. Создайте аккаунт на [calendly.com](https://calendly.com)
2. Создайте event types
3. Скопируйте embed URL для встраивания

#### Mux

1. Зарегистрируйтесь на [mux.com](https://mux.com)
2. Создайте API token в настройках
3. Скопируйте Token ID и Secret

#### Resend

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Создайте API key
3. Настройте домен для отправки email

#### Google Analytics

1. Создайте свойство в [Google Analytics](https://analytics.google.com)
2. Получите Measurement ID (формат: G-XXXXXXXXXX)

## Структура проекта

```text
savage-movie/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Публичные страницы
│   ├── booking/           # Бронирование
│   ├── dashboard/         # Личный кабинет студента
│   ├── admin/              # Админ-панель
│   └── api/                # API routes
├── components/             # React компоненты
│   ├── ui/                # Shadcn/UI компоненты
│   ├── sections/          # Секции страниц
│   └── features/          # Функциональные компоненты
├── lib/                    # Утилиты и конфигурация
│   ├── api/               # API клиенты (auth, projects, courses, enrollments)
│   ├── payments/           # ЮKassa интеграция
│   ├── email/              # Resend интеграция
│   └── mux/                # Mux интеграция
├── types/                  # TypeScript типы
├── backend/                # Python FastAPI backend
│   ├── app/               # Приложение FastAPI
│   │   ├── delivery/      # Delivery слой (API роуты)
│   │   ├── interfaces/    # DTO и адаптеры
│   │   │   └── schemas/   # Pydantic схемы
│   │   ├── application/   # Application слой
│   │   │   └── services/  # Application сервисы
│   │   ├── infrastructure/ # Инфраструктура
│   │   │   ├── db/        # БД и ORM
│   │   │   │   └── models/ # SQLAlchemy модели
│   │   │   └── integrations/ # Внешние интеграции
│   ├── alembic/           # Alembic миграции
│   └── scripts/           # SQL утилиты (поддержка/восстановление)
```

Подробная структура проекта: см. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).
Архитектура и решения: [ARCHITECTURE.md](ARCHITECTURE.md), [TARGET_STRUCTURE.md](TARGET_STRUCTURE.md).
История изменений: [CHANGELOG.md](CHANGELOG.md).

## Основные функции

### Публичные страницы

- Главная страница с hero video, проектами, услугами, отзывами
- Страница проектов с фильтрацией
- Детальные страницы проектов
- Страница курсов с фильтрацией
- Детальные страницы курсов
- Страница "О нас"
- Блог
- Контакты с формой

### Бронирование

- Интеграция с Calendly
- Выбор типа услуги
- Автоматические подтверждения по email

### Платежи

- Интеграция с ЮKassa
- Покупка курсов
- Webhook для обработки платежей

### Личный кабинет студента

- Список записанных курсов
- Прогресс по курсам
- Просмотр видео уроков
- Навигация между уроками

### Админ-панель

- Управление проектами
- Управление курсами
- Управление клиентами
- Управление отзывами
- Просмотр заявок с контактной формы
- Настройки сайта

## Развертывание

### Frontend (Next.js) на Vercel

1. Подключите репозиторий к Vercel
2. Настройте environment variables в Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL` - URL вашего Python API
   - Остальные переменные (ЮKassa, Mux, Resend и т.д.)
3. Деплой произойдет автоматически

### Backend (Python API) на VPS

См. подробные инструкции в `backend/README.md`.

Основные шаги:

1. Установите PostgreSQL на сервере
2. Установите Python 3.11+ и зависимости
3. Настройте переменные окружения
4. Запустите миграции БД
5. Настройте systemd service для автозапуска
6. Настройте Nginx как reverse proxy
7. Настройте SSL (Let's Encrypt)

### Настройка домена

1. В Vercel Dashboard добавьте custom domain для frontend
2. Настройте DNS записи:
   - A-запись для API (например, api.savagemovie.ru)
   - CNAME для frontend (например, savagemovie.ru)
3. SSL сертификаты будут выданы автоматически (Vercel) или через Let's Encrypt (VPS)

## Коммит и пуш

Интерактивный скрипт: пошагово спрашивает тип коммита, описание, детали, превью и пушить ли в remote.

**Запуск (простая команда):**

```bash
npm run commit
```

Короткий алиас: `npm run gc`.

Скрипт проведёт через: добавление файлов → тип (feat/fix/chore/…) → краткое описание → детали (по желанию) → превью → коммит → пуш (если есть `origin`).
При первом пуше задай remote: `git remote add origin <URL>`.

## Лицензия

Private - все права защищены
