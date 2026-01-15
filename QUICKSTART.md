# Быстрый старт SAVAGE MOVIE

## Запуск через Docker (5 минут)

### 1. Установите Docker

Убедитесь, что у вас установлены Docker и Docker Compose:
```bash
docker --version
docker-compose --version  # или docker compose version
```

### 2. Запустите проект

```bash
# Автоматическая инициализация (создаст .env и запустит все сервисы)
./scripts/init-docker.sh

# Или быстрый запуск (если .env уже есть)
./docker-start.sh dev
```

### 3. Дождитесь запуска

Подождите 30-60 секунд, пока все контейнеры запустятся. Проверьте статус:

```bash
docker-compose -f docker-compose.dev.yml ps
```

### 4. Откройте в браузере

- **Сайт**: http://localhost:3000
- **Админ-панель**: http://localhost:3000/admin
- **API документация**: http://localhost:8001/docs

### 5. Создайте первого администратора

Для входа в админ-панель нужно создать пользователя с ролью `admin`. 

**Рекомендуемый способ: Через API + обновление роли**

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

**Самый простой способ: Используйте скрипт**

```bash
./scripts/create-admin.sh admin@example.com your_password
```

Этот скрипт автоматически создаст администратора с указанным email и паролем.

## Что дальше?

1. **Настройте переменные окружения** в `.env` (OAuth, платежи, email и т.д.)
2. **Войдите в админ-панель** по адресу http://localhost:3000/admin
3. **Добавьте контент**: проекты, курсы, клиентов, отзывы
4. **Настройте hero видео** в разделе "Настройки"

## Полезные команды

```bash
# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Остановка
docker-compose -f docker-compose.dev.yml down

# Перезапуск
docker-compose -f docker-compose.dev.yml restart

# Очистка (удалит все данные БД!)
docker-compose -f docker-compose.dev.yml down -v
```

## Troubleshooting

### БД не запускается
```bash
docker-compose -f docker-compose.dev.yml logs db
```

### Backend не подключается к БД
Убедитесь, что БД полностью запустилась (healthcheck прошел):
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Миграции не выполнились
Выполните вручную:
```bash
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/init_db.sql
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/add_admin_tables.sql
```

### Порт занят

Docker использует альтернативные порты, чтобы не конфликтовать с локальными сервисами:
- **PostgreSQL**: порт **5433** на хосте (вместо стандартного 5432)
- **Backend API**: порт **8001** на хосте (вместо стандартного 8000)

Если нужно использовать стандартные порты, остановите локальные сервисы:

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

Или измените порты в `docker-compose.dev.yml`.
