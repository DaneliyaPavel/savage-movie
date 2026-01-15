#!/bin/bash
# Быстрый запуск проекта в Docker

set -e

echo "🚀 Запуск SAVAGE MOVIE в Docker..."

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен"
    exit 1
fi

# Определяем команду docker-compose
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        echo "❌ Docker Compose не установлен"
        exit 1
    fi
fi

# Определяем режим (dev или prod)
MODE=${1:-dev}

if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "📦 Production режим"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔧 Development режим"
fi

# Создание директорий для uploads
mkdir -p backend/uploads/images backend/uploads/videos

# Запуск
echo "🐳 Запуск контейнеров..."
$COMPOSE_CMD -f $COMPOSE_FILE up -d

echo ""
echo "✅ Проект запущен!"
echo ""
echo "📋 Доступные сервисы:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8001"
echo "   - API Docs: http://localhost:8001/docs"
echo "   - Admin Panel: http://localhost:3000/admin"
echo ""
echo "📝 Полезные команды:"
echo "   - Логи: $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
echo "   - Остановка: $COMPOSE_CMD -f $COMPOSE_FILE down"
echo "   - Перезапуск: $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "   - Создать админа: ./scripts/create-admin.sh <email> <password>"
echo ""
