#!/bin/bash

# Скрипт для инициализации проекта в Docker

set -e

echo "🚀 Инициализация проекта SAVAGE MOVIE в Docker..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Создание .env файла если его нет
if [ ! -f .env ]; then
    echo "📝 Создание .env файла..."
    cat > .env << EOF
# Database (используется в Docker)
DB_HOST=db
DB_PORT=5432
DB_NAME=savage_movie
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# App URLs
APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email
RESEND_API_KEY=
ADMIN_EMAIL=savage.movie@yandex.ru
RESEND_FROM_EMAIL=noreply@savagemovie.ru

# OAuth (заполните при необходимости)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/oauth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_REDIRECT_URI=http://localhost:8000/api/auth/oauth/yandex/callback
NEXT_PUBLIC_YANDEX_CLIENT_ID=

# Payments
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

# Calendly
NEXT_PUBLIC_CALENDLY_URL=

# Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
NEXT_PUBLIC_MUX_ENV_KEY=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
EOF
    echo "✅ .env файл создан. Отредактируйте его и добавьте необходимые ключи."
fi

# Создание директории для uploads
mkdir -p backend/uploads/images backend/uploads/videos

echo "🐳 Запуск Docker контейнеров..."
docker-compose up -d db

echo "⏳ Ожидание готовности базы данных..."
sleep 10

echo "📦 Выполнение миграций базы данных..."
docker-compose exec -T db psql -U postgres -d savage_movie -f /docker-entrypoint-initdb.d/init_db.sql || echo "⚠️  init_db.sql уже выполнен или не найден"
docker-compose exec -T db psql -U postgres -d savage_movie -f /docker-entrypoint-initdb.d/add_admin_tables.sql || echo "⚠️  add_admin_tables.sql уже выполнен или не найден"

echo "🚀 Запуск всех сервисов..."
docker-compose up -d

echo ""
echo "✅ Проект запущен!"
echo ""
echo "📋 Доступные сервисы:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Admin Panel: http://localhost:3000/admin"
echo ""
echo "📝 Полезные команды:"
echo "   - Просмотр логов: docker-compose logs -f"
echo "   - Остановка: docker-compose down"
echo "   - Перезапуск: docker-compose restart"
echo "   - Очистка: docker-compose down -v"
echo ""
