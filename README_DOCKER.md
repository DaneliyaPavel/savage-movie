# Docker Setup - Краткая инструкция

## Быстрый запуск

```bash
# 1. Запустите автоматическую инициализацию
./scripts/init-docker.sh

# 2. Или быстрый запуск (если .env уже есть)
./docker-start.sh dev
```

## Что происходит при запуске

1. **Создается .env файл** (если его нет) с базовыми настройками
2. **Запускается PostgreSQL** в контейнере
3. **Автоматически выполняются миграции БД**:
   - `init_db.sql` - основные таблицы
   - `add_admin_tables.sql` - таблицы админ-панели
4. **Запускается Backend API** (FastAPI на порту 8000)
5. **Запускается Frontend** (Next.js на порту 3000)

## Доступ к сервисам

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **Admin Panel**: http://localhost:3000/admin
- **PostgreSQL**: localhost:5433 (внутри контейнера - 5432)

## Создание первого администратора

После запуска создайте пользователя с ролью `admin`:

```bash
# Войти в контейнер БД
docker exec -it savage_movie_db_dev psql -U postgres -d savage_movie

# Создать пользователя (в psql)
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@example.com', '$2b$12$...', 'Admin', 'admin');
```

Или зарегистрируйтесь через API и обновите роль в БД.

## Управление контейнерами

```bash
# Просмотр статуса
docker-compose -f docker-compose.dev.yml ps

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Остановка
docker-compose -f docker-compose.dev.yml down

# Перезапуск
docker-compose -f docker-compose.dev.yml restart

# Полная очистка (удалит БД!)
docker-compose -f docker-compose.dev.yml down -v
```

## Production

Для production используйте:

```bash
./docker-start.sh prod
# или
docker-compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

### Миграции не выполнились

```bash
# Выполнить вручную
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/init_db.sql
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/add_admin_tables.sql
```

### Пересоздать БД с нуля

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

Подробнее см. [DOCKER_SETUP.md](DOCKER_SETUP.md)
