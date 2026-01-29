# Docker Setup для SAVAGE MOVIE

Инструкция по запуску проекта через Docker. Сейчас используется **одно окружение** и один `docker-compose.yml`.

## Требования

- Docker
- Docker Compose (`docker compose` или `docker-compose`)

## Быстрый старт

### Вариант 1: Автоматическая инициализация

```bash
./scripts/init-docker.sh
```

Скрипт создаст директории для uploads, дождется готовности базы и запустит сервисы.

### Вариант 2: Быстрый старт

```bash
./docker-start.sh
```

### Вариант 3: Управляемый рестарт/ребилд

```bash
./scripts/docker-dev.sh      # меню
./scripts/docker-dev.sh restart
./scripts/docker-dev.sh rebuild
```

## Переменные окружения

Используйте `.env.example` как шаблон:

```bash
cp .env.example .env
```

Минимально для локального запуска можно оставить значения по умолчанию.
Для продакшна обязательно задайте `DB_PASSWORD` и `JWT_SECRET`.

## Порты

| Сервис      | Порт на хосте | Порт в контейнере | Описание           |
| ----------- | ------------- | ----------------- | ------------------ |
| Frontend    | 3000          | 3000              | Next.js приложение |
| Backend API | 8001          | 8000              | FastAPI            |
| PostgreSQL  | 5433          | 5432              | База данных        |

## Миграции

Alembic миграции выполняются **автоматически** при старте backend контейнера.
Для ручного запуска:

```bash
docker exec savage_movie_backend alembic -c /app/backend/alembic.ini upgrade head
```

## Создание администратора

```bash
./scripts/create-admin.sh admin@example.com your_password
```

Или через env:

```env
SEED_ADMIN=true
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_password
```

## Полезные команды

```bash
# Запуск
docker-compose -f docker-compose.yml up -d

# Логи
docker-compose -f docker-compose.yml logs -f

# Остановка
docker-compose -f docker-compose.yml down

# Пересборка
docker-compose -f docker-compose.yml up -d --build
```

## Данные и volume

- Данные PostgreSQL хранятся в `postgres_data_dev`.
- Загрузки хранятся в `backend/uploads`.
- **Не используйте** `docker-compose down -v`, если не хотите потерять данные.
