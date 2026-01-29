#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
RESTORE_DIR=""
NO_BUILD=0
NO_CACHE=0
RESTART_AFTER_RESTORE=0

usage() {
  echo "Usage: $0 [--restore <backup_dir>] [--no-build] [--no-cache] [--restart-after-restore]"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --restore)
      if [ -z "${2:-}" ]; then
        echo "Не указана директория для --restore"
        usage
        exit 1
      fi
      RESTORE_DIR="${2:-}"
      shift 2
      ;;
    --no-build)
      NO_BUILD=1
      shift
      ;;
    --no-cache)
      NO_CACHE=1
      shift
      ;;
    --restart-after-restore)
      RESTART_AFTER_RESTORE=1
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

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose файл не найден: $COMPOSE_FILE"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "Docker не установлен."
  exit 1
fi

COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
  if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
  else
    echo "Docker Compose не установлен."
    exit 1
  fi
fi

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$ENV_FILE"
    echo "Создан $ENV_FILE из .env.example. Проверьте значения."
  else
    echo "Файл .env отсутствует, и .env.example не найден."
    exit 1
  fi
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

if [ "$NO_BUILD" -eq 1 ] && [ "$NO_CACHE" -eq 1 ]; then
  echo "Нельзя одновременно использовать --no-build и --no-cache"
  exit 1
fi

if [ "$NO_CACHE" -eq 1 ]; then
  $COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
  $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --force-recreate --remove-orphans
else
  UP_ARGS=("-d" "--force-recreate" "--remove-orphans")
  if [ "$NO_BUILD" -eq 0 ]; then
    UP_ARGS+=("--build")
  fi
  $COMPOSE_CMD -f "$COMPOSE_FILE" up "${UP_ARGS[@]}"
fi

echo "Сервисы запущены."

if [ -n "$RESTORE_DIR" ]; then
  if [ ! -d "$RESTORE_DIR" ]; then
    echo "Директория бэкапа не найдена: $RESTORE_DIR"
    exit 1
  fi
  "$ROOT_DIR/scripts/restore.sh" "$RESTORE_DIR"
  if [ "$RESTART_AFTER_RESTORE" -eq 1 ]; then
    $COMPOSE_CMD -f "$COMPOSE_FILE" restart
  fi
fi

cat <<INFO

Полезные команды:
- Логи: $COMPOSE_CMD -f $COMPOSE_FILE logs -f
- Остановка: $COMPOSE_CMD -f $COMPOSE_FILE down

INFO
