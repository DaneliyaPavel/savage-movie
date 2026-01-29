#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
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

read_env_var() {
  local key="$1"
  awk -F= -v k="$key" '$1==k {sub("^" k "=", "", $0); print $0; exit}' "$ENV_FILE"
}

write_env_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

sync_db_name_from_running_db() {
  local db_container=""
  if docker ps --format '{{.Names}}' | grep -q "^savage_movie_db$"; then
    db_container="savage_movie_db"
  elif docker ps --format '{{.Names}}' | grep -q "^savage_movie_db_dev$"; then
    db_container="savage_movie_db_dev"
  fi

  if [ -z "$db_container" ]; then
    return 0
  fi

  local db_names
  db_names=$(
    docker exec "$db_container" psql -U postgres -tA -c \
      "SELECT datname FROM pg_database WHERE datistemplate = false;" 2>/dev/null \
      | awk 'NF' | grep -v '^postgres$' || true
  )

  local db_count
  db_count=$(echo "$db_names" | awk 'NF {count++} END {print count+0}')

  if [ "$db_count" -eq 0 ]; then
    return 0
  fi

  local current_db_name
  current_db_name=$(read_env_var "DB_NAME")

  if [ -z "$current_db_name" ] && [ "$db_count" -eq 1 ]; then
    local detected_db
    detected_db=$(echo "$db_names" | head -n 1)
    write_env_var "DB_NAME" "$detected_db"
    echo "ℹ️  DB_NAME не был задан. Установлен из текущей базы: $detected_db"
    return 0
  fi

  if [ -n "$current_db_name" ]; then
    if ! echo "$db_names" | grep -qx "$current_db_name"; then
      if [ "$db_count" -eq 1 ]; then
        local detected_db
        detected_db=$(echo "$db_names" | head -n 1)
        write_env_var "DB_NAME" "$detected_db"
        echo "ℹ️  DB_NAME=$current_db_name не найден. Переключено на $detected_db"
      else
        echo "⚠️  DB_NAME=$current_db_name не найден в базе. Доступные базы:"
        echo "$db_names" | sed 's/^/   - /'
      fi
    fi
  fi
}

sync_db_name_from_running_db

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
