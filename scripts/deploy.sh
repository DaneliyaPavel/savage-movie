#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
BRANCH="main"
PRUNE=1
FORCE=0

usage() {
  echo "Usage: $0 [branch] [--no-prune] [--force|-f]"
  echo "  --no-prune  keep old images (faster, but uses more disk)"
  echo "  --force     proceed even if local changes exist (non-interactive safe)"
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
    --force|-f)
      FORCE=1
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
if ! git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  echo "Ветка не найдена: origin/$BRANCH"
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  if [ "$FORCE" -eq 1 ]; then
    echo "Локальные изменения будут удалены (--force)."
  elif [ ! -t 0 ]; then
    echo "Ошибка: локальные изменения и не-интерактивный режим. Используй --force."
    exit 1
  else
    echo "Внимание: локальные изменения будут удалены!"
    read -r -p "Продолжить? [y/N]: " CONFIRM_RESET
    case "${CONFIRM_RESET:-N}" in
      y|Y|yes|YES|д|Д|да|ДА) ;;
      *) echo "Отменено."; exit 1 ;;
    esac
  fi
fi
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

BACKEND_IMAGE="${REGISTRY:-ghcr.io/daneliyapavel}/savage-movie-backend:${IMAGE_TAG:-latest}"
FRONTEND_IMAGE="${REGISTRY:-ghcr.io/daneliyapavel}/savage-movie-frontend:${IMAGE_TAG:-latest}"

if ! docker image inspect "$BACKEND_IMAGE" >/dev/null 2>&1; then
  echo "Образ не найден: $BACKEND_IMAGE"
  echo "Проверь доступ к registry (docker login / REGISTRY_USER/REGISTRY_TOKEN)."
  exit 1
fi

if ! docker image inspect "$FRONTEND_IMAGE" >/dev/null 2>&1; then
  echo "Образ не найден: $FRONTEND_IMAGE"
  echo "Проверь доступ к registry (docker login / REGISTRY_USER/REGISTRY_TOKEN)."
  exit 1
fi

$COMPOSE_CMD -f "$COMPOSE_FILE" up -d --remove-orphans --no-build

if [ "$PRUNE" -eq 1 ]; then
  docker image prune -f || true
fi

echo "Deploy completed."
