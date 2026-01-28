#!/bin/bash
# Скрипт для применения миграций Alembic в Docker

set -e

COMPOSE_FILE="${1:-docker-compose.yml}"

COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        echo "Docker Compose is not installed."
        exit 1
    fi
fi

echo "Running Alembic migrations..."
$COMPOSE_CMD -f "$COMPOSE_FILE" run --rm backend alembic -c /app/backend/alembic.ini upgrade head

echo "Database migration complete!"
