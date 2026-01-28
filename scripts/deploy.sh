#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
BRANCH="${1:-main}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Файл .env не найден: $ENV_FILE"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose файл не найден: $COMPOSE_FILE"
  exit 1
fi

echo "Updating repository to origin/$BRANCH..."
cd "$ROOT_DIR"
git fetch --all
git reset --hard "origin/$BRANCH"
chmod +x up scripts/*.sh || true

# Полная пересборка без кэша и перезапуск
"$ROOT_DIR/up" --no-cache

# Чистка билд‑кэша и старых образов
docker image prune -a -f || true
docker builder prune -a -f || true

echo "Deploy completed."
