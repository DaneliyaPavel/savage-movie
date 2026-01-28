#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"
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
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d
  fi
fi

cat <<INFO

Полезные команды:
- Логи: $COMPOSE_CMD -f $COMPOSE_FILE logs -f
- Остановка: $COMPOSE_CMD -f $COMPOSE_FILE down

INFO
