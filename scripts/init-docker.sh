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

if [ -f .env ]; then
    echo "📝 Используется .env файл из корня проекта."
else
    echo "ℹ️ .env файл не найден. Переменные берутся из окружения (см. .env.example)."
fi

# Создание директории для uploads
mkdir -p backend/uploads/images backend/uploads/videos

COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

echo "🐳 Запуск Docker контейнеров..."
$COMPOSE_CMD -f docker-compose.yml up -d db

echo "⏳ Ожидание готовности базы данных..."
sleep 10

echo "📦 Миграции применяются через Alembic при старте backend..."

echo "🚀 Запуск всех сервисов..."
$COMPOSE_CMD -f docker-compose.yml up -d

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
echo "   - Просмотр логов: $COMPOSE_CMD -f docker-compose.yml logs -f"
echo "   - Остановка: $COMPOSE_CMD -f docker-compose.yml down"
echo "   - Перезапуск: $COMPOSE_CMD -f docker-compose.yml restart"
echo "   - Очистка: $COMPOSE_CMD -f docker-compose.yml down -v"
echo ""
