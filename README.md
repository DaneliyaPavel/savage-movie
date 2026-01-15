# SAVAGE MOVIE - Сайт видеографа и продюсера

Премиальный сайт-портфолио для видеографа и продюсера с функциями бронирования услуг и продажи онлайн-курсов.

## Технологии

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Animations**: Framer Motion
- **Backend**: Python FastAPI + PostgreSQL
- **Authentication**: JWT + OAuth (Google, Yandex)
- **Payments**: ЮKassa
- **Booking**: Calendly
- **Video**: Mux
- **Email**: Resend
- **Forms**: React Hook Form + Zod

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd savage-movie
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local` на основе `.env.example`:
```bash
cp .env.example .env.local
```

4. Заполните переменные окружения в `.env.local`:
- `NEXT_PUBLIC_API_URL` - URL Python API (по умолчанию http://localhost:8000)
- ЮKassa credentials
- Calendly URL
- Mux credentials
- Resend API key
- Google Analytics ID
- OAuth Client IDs (Google, Yandex)

5. Настройте Python Backend:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Заполните переменные окружения в backend/.env
# Создайте БД PostgreSQL и выполните миграции
psql -U postgres -d savage_movie -f scripts/init_db.sql
# Запустите API сервер
uvicorn app.main:app --reload --port 8000
```

6. Запустите Next.js dev сервер:
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
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
│   │   ├── api/           # API роуты
│   │   ├── models/        # SQLAlchemy модели
│   │   ├── schemas/       # Pydantic схемы
│   │   └── services/      # Бизнес-логика
│   └── scripts/           # Скрипты (миграции БД)
└── supabase/              # Старые Supabase миграции (для референса)
```

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
- Просмотр бронирований
- Просмотр заявок с контактной формы

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

## Переменные окружения

См. `.env.example` для полного списка переменных окружения.

## Лицензия

Private - все права защищены
