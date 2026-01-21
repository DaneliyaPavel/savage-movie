# Docker Setup для SAVAGE MOVIE

Полная инструкция по развертыванию проекта через Docker.

## Быстрый старт

### Вариант 1: Автоматическая инициализация

```bash
# Запустить скрипт инициализации (создаст .env и запустит контейнеры)
./scripts/init-docker.sh
```

### Вариант 2: Ручная настройка

### 1. Создайте файл `.env` в корне проекта

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=savage_movie

# JWT
JWT_SECRET=your_very_secret_jwt_key_change_in_production

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_YANDEX_CLIENT_ID=your_yandex_client_id

# Payments
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Other services
NEXT_PUBLIC_CALENDLY_URL=your_calendly_url
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
NEXT_PUBLIC_MUX_ENV_KEY=your_mux_env_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@savagemovie.ru
ADMIN_EMAIL=savage.movie@yandex.ru
```

### 2. Запуск в режиме разработки

```bash
# Быстрый запуск (использует скрипт)
./docker-start.sh dev

# Или вручную
docker-compose -f docker-compose.dev.yml up -d

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Остановить
docker-compose -f docker-compose.dev.yml down
```

### 3. Запуск в production режиме

```bash
# Быстрый запуск
./docker-start.sh prod

# Или вручную
docker-compose -f docker-compose.prod.yml up -d --build

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Остановить
docker-compose -f docker-compose.prod.yml down
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

Если хотите использовать стандартные порты, измените в `docker-compose.dev.yml`:

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

Миграции выполняются **автоматически** при первом запуске контейнера БД через volume mount `/docker-entrypoint-initdb.d`.

Скрипты выполняются в порядке:

1. `01_init_db.sql` - основные таблицы
2. `02_add_admin_tables.sql` - таблицы админ-панели

**Важно:** Миграции выполняются только при первом создании volume. Если volume уже существует, миграции не выполнятся автоматически.

Для ручного выполнения (если нужно):

```bash
# Войти в контейнер БД
docker exec -it savage_movie_db_dev bash

# Выполнить миграции
psql -U postgres -d savage_movie -f /docker-entrypoint-initdb.d/init_db.sql
psql -U postgres -d savage_movie -f /docker-entrypoint-initdb.d/add_admin_tables.sql
```

Или из хоста:

```bash
# Для dev окружения
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/init_db.sql
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/add_admin_tables.sql

# Для prod окружения
docker exec -i savage_movie_db_prod psql -U postgres -d savage_movie < backend/scripts/init_db.sql
docker exec -i savage_movie_db_prod psql -U postgres -d savage_movie < backend/scripts/add_admin_tables.sql
```

### Пересоздание БД с миграциями

Если нужно пересоздать БД с нуля:

```bash
# Остановить и удалить volumes (ОСТОРОЖНО: удалит все данные!)
docker-compose -f docker-compose.dev.yml down -v

# Запустить заново (миграции выполнятся автоматически)
docker-compose -f docker-compose.dev.yml up -d
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
docker-compose -f docker-compose.dev.yml down
```

2. **Очистите кэш Next.js** (на хосте, если нужно):

```bash
rm -rf .next
```

3. **Перезапустите контейнеры**:

```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

Или с логами:

```bash
docker-compose -f docker-compose.dev.yml up --build -d
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Перезапуск отдельных сервисов

```bash
# Перезапустить только frontend
docker-compose -f docker-compose.dev.yml restart frontend

# Перезапустить только backend
docker-compose -f docker-compose.dev.yml restart backend

# Перезапустить все
docker-compose -f docker-compose.dev.yml restart
```

## Полезные команды

```bash
# Пересобрать контейнеры
docker-compose -f docker-compose.dev.yml up -d --build

# Очистить все (включая volumes)
docker-compose -f docker-compose.dev.yml down -v

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f db

# Выполнить команду в контейнере
docker exec -it savage_movie_backend_dev bash
docker exec -it savage_movie_frontend_dev sh

# Проверить статус
docker-compose -f docker-compose.dev.yml ps

# Очистка и перезапуск
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

## Структура

- `docker-compose.yml` - базовая конфигурация
- `docker-compose.dev.yml` - для разработки (с hot reload)
- `docker-compose.prod.yml` - для production
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
docker-compose -f docker-compose.dev.yml logs db
```

Проверьте healthcheck:

```bash
docker-compose -f docker-compose.dev.yml ps
```

### Проблемы с загрузкой файлов

Проверьте права доступа к директории uploads:

```bash
docker exec -it savage_movie_backend_dev chmod -R 755 /app/backend/uploads
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

2. Или измените порты в `docker-compose.dev.yml`

### Миграции не выполнились

Выполните вручную:

```bash
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/init_db.sql
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/add_admin_tables.sql
```

### Очистка и перезапуск

```bash
# Остановить и удалить контейнеры
docker-compose -f docker-compose.dev.yml down

# Удалить volumes (ОСТОРОЖНО: удалит данные БД!)
docker-compose -f docker-compose.dev.yml down -v

# Пересобрать с нуля
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
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
docker-compose -f docker-compose.dev.yml ps
```

Проверьте логи:

```bash
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs db
```
