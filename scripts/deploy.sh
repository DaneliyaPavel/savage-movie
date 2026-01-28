#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
BRANCH="main"
PRUNE=1

usage() {
  echo "Usage: $0 [branch] [--no-prune]"
  echo "  --no-prune  keep old images (faster, but uses more disk)"
}

if [ $# -gt 0 ] && [[ "${1:-}" != --* ]]; then
  BRANCH="$1"
  shift
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --no-prune)
      PRUNE=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown аргумент: $1"
      usage
      exit 1
      ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Файл .env не найден: $ENV_FILE"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose файл не найден: $COMPOSE_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

echo "Updating repository to origin/$BRANCH..."
cd "$ROOT_DIR"
git fetch --all
git reset --hard "origin/$BRANCH"
chmod +x up scripts/*.sh || true

# Логин в registry (если задан)
if [ -n "${REGISTRY_USER:-}" ] && [ -n "${REGISTRY_TOKEN:-}" ]; then
  echo "$REGISTRY_TOKEN" | docker login "${REGISTRY:-ghcr.io}" -u "$REGISTRY_USER" --password-stdin
fi

# Быстрый деплой: pull + restart без сборки на сервере
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
  if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
  else
    echo "Docker Compose не установлен."
    exit 1
  fi
fi

$COMPOSE_CMD -f "$COMPOSE_FILE" pull
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d --remove-orphans --no-build

if [ "$PRUNE" -eq 1 ]; then
  docker image prune -f || true
fi

echo "Deploy completed."
