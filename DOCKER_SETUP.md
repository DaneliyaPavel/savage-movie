# Docker Setup для SAVAGE MOVIE

Полная инструкция по развертыванию проекта через Docker.

> Сейчас используется **одно окружение** и один `docker-compose.yml` (dev/prod не разделяются). Данные живут в `postgres_data_dev` и `backend/uploads`.

## Быстрый старт

### Вариант 1: Автоматическая инициализация

```bash
# Запустить скрипт инициализации (использует переменные окружения и запустит контейнеры)
./scripts/init-docker.sh
```

### Вариант 2: Ручная настройка

### 1. Настройте переменные окружения (опционально)

Используйте `.env.example` как список необходимых переменных. Для Docker можно
передать их через окружение или через ваш способ управления секретами.

### 2. Запуск проекта

```bash
# Быстрый запуск (использует скрипт)
./docker-start.sh

# Или вручную
docker-compose -f docker-compose.yml up -d

# Просмотр логов
docker-compose -f docker-compose.yml logs -f

# Остановить
docker-compose -f docker-compose.yml down
```

### 3. Пересборка образов (если нужно)

```bash
docker-compose -f docker-compose.yml up -d --build
```

## Порты

Чтобы избежать конфликтов с локальными сервисами, Docker использует альтернативные порты:

| Сервис | Порт на хосте | Порт в контейнере | Описание |
|--------|---------------|-------------------|----------|
| Frontend | 3000 | 3000 | Next.js приложение |
| Backend API | **8001** | 8000 | FastAPI (внутри контейнера - 8000) |
| PostgreSQL | **5433** | 5432 | База данных (внутри контейнера - 5432) |

### Почему альтернативные порты?

- **PostgreSQL (5433)**: Локальный PostgreSQL обычно работает на 5432
- **Backend (8001)**: Другие сервисы могут использовать 8000

### Подключение к БД извне Docker

Если нужно подключиться к PostgreSQL из внешнего клиента:

```bash
psql -h localhost -p 5433 -U postgres -d savage_movie
```

### Изменение портов

Если хотите использовать стандартные порты, измените в `docker-compose.yml`:

```yaml
# Для PostgreSQL
ports:
  - "5432:5432"  # вместо "5433:5432"

# Для Backend
ports:
  - "8000:8000"  # вместо "8001:8000"
```

И обновите `NEXT_PUBLIC_API_URL` в переменных окружения frontend.

## Выполнение миграций БД

Миграции выполняются **автоматически** при старте backend контейнера через Alembic.

Для ручного запуска (если нужно):

```bash
# Dev окружение
docker exec savage_movie_backend alembic -c /app/backend/alembic.ini upgrade head

# Prod окружение
docker exec savage_movie_backend alembic -c /app/backend/alembic.ini upgrade head
```

Если база уже создана старыми SQL-скриптами и соответствует текущей модели, пометьте её как актуальную:

```bash
docker exec savage_movie_backend alembic -c /app/backend/alembic.ini stamp head
```

### Пересоздание БД с миграциями

Если нужно пересоздать БД с нуля:

```bash
# Остановить и удалить volumes (ОСТОРОЖНО: удалит все данные!)
docker-compose -f docker-compose.yml down -v

# Запустить заново (миграции применятся через Alembic)
docker-compose -f docker-compose.yml up -d
```

## Доступ к сервисам

После запуска:

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8001>
- **API Docs**: <http://localhost:8001/docs>
- **Админ-панель**: <http://localhost:3000/admin>
- **PostgreSQL**: localhost:5433 (внутри контейнера - 5432)

## Перезапуск после изменений

### Если используется Docker

1. **Остановите контейнеры**:

```bash
docker-compose -f docker-compose.yml down
```

2. **Очистите кэш Next.js** (на хосте, если нужно):

```bash
rm -rf .next
```

3. **Перезапустите контейнеры**:

```bash
docker-compose -f docker-compose.yml up --build -d
```

Или с логами:

```bash
docker-compose -f docker-compose.yml up --build -d
docker-compose -f docker-compose.yml logs -f frontend
```

### Перезапуск отдельных сервисов

```bash
# Перезапустить только frontend
docker-compose -f docker-compose.yml restart frontend

# Перезапустить только backend
docker-compose -f docker-compose.yml restart backend

# Перезапустить все
docker-compose -f docker-compose.yml restart
```

## Полезные команды

```bash
# Пересобрать контейнеры
docker-compose -f docker-compose.yml up -d --build

# Очистить все (включая volumes)
docker-compose -f docker-compose.yml down -v

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.yml logs -f backend
docker-compose -f docker-compose.yml logs -f frontend
docker-compose -f docker-compose.yml logs -f db

# Выполнить команду в контейнере
docker exec -it savage_movie_backend bash
docker exec -it savage_movie_frontend sh

# Проверить статус
docker-compose -f docker-compose.yml ps

# Очистка и перезапуск
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml up -d --build
```

## Структура

- `docker-compose.yml` - базовая конфигурация
- `docker-compose.yml` - для разработки (с hot reload)
- `docker-compose.yml` - для production
- `Dockerfile.backend` - образ для Python API
- `Dockerfile.frontend` - образ для Next.js (production)
- `Dockerfile.frontend.dev` - образ для Next.js (development)

## Volumes

- `postgres_data` - данные PostgreSQL
- `backend/uploads` - загруженные файлы (изображения, видео)

## Troubleshooting

### Проблемы с подключением к БД

Убедитесь, что БД полностью запустилась:

```bash
docker-compose -f docker-compose.yml logs db
```

Проверьте healthcheck:

```bash
docker-compose -f docker-compose.yml ps
```

### Проблемы с загрузкой файлов

Проверьте права доступа к директории uploads:

```bash
docker exec -it savage_movie_backend chmod -R 755 /app/backend/uploads
```

### Порт занят

Если порт 8001 или 5433 уже занят:

1. Остановите локальные сервисы

```bash
# Остановить локальный PostgreSQL (macOS Homebrew)
brew services stop postgresql@16
# или
brew services stop postgresql

# Остановить локальный PostgreSQL (Linux systemd)
sudo systemctl stop postgresql

# Остановить сервис на порту 8000 (если есть)
lsof -ti:8000 | xargs kill -9
```

2. Или измените порты в `docker-compose.yml`

### Миграции не выполнились

Выполните вручную:

```bash
docker exec savage_movie_backend alembic -c /app/backend/alembic.ini upgrade head
```

### Очистка и перезапуск

```bash
# Остановить и удалить контейнеры
docker-compose -f docker-compose.yml down

# Удалить volumes (ОСТОРОЖНО: удалит данные БД!)
docker-compose -f docker-compose.yml down -v

# Пересобрать с нуля
docker-compose -f docker-compose.yml build --no-cache
docker-compose -f docker-compose.yml up -d
```

### Быстрый перезапуск dev

```bash
npm run docker:restart
# или
./scripts/docker-dev.sh restart
```

### Пересборка dev без кэша и без удаления данных

```bash
npm run docker:rebuild
# или
./scripts/docker-dev.sh rebuild
```

### Интерактивный выбор действия

```bash
npm run docker:dev
# или
./scripts/docker-dev.sh
```

### Backend не подключается к БД

Убедитесь, что БД полностью запустилась (healthcheck прошел):

```bash
docker-compose -f docker-compose.yml ps
```

Проверьте логи:

```bash
docker-compose -f docker-compose.yml logs backend
docker-compose -f docker-compose.yml logs db
```
