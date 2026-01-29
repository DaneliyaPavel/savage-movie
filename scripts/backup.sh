#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
OUT_DIR=""

usage() {
  echo "Использование: $0 [--compose <file>] [--out <dir>]"
}

make_abs_path() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    echo "$path"
  else
    echo "$ROOT_DIR/$path"
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --prod)
      if [ -f "$ROOT_DIR/docker-compose.prod.yml" ]; then
        COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
      else
        echo "⚠️  docker-compose.prod.yml не найден, используется docker-compose.yml"
        COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
      fi
      shift
      ;;
    --dev)
      if [ -f "$ROOT_DIR/docker-compose.dev.yml" ]; then
        COMPOSE_FILE="$ROOT_DIR/docker-compose.dev.yml"
      else
        COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
      fi
      shift
      ;;
    --compose)
      if [ -z "${2:-}" ]; then
        echo "Ошибка: --compose требует указать файл"
        usage
        exit 1
      fi
      COMPOSE_FILE="$(make_abs_path "$2")"
      shift 2
      ;;
    --out)
      if [ -z "${2:-}" ]; then
        echo "Ошибка: --out требует указать директорию"
        usage
        exit 1
      fi
      OUT_DIR="$(make_abs_path "$2")"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $1"
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

if [ -z "$OUT_DIR" ]; then
  TS="$(date +%Y%m%d_%H%M%S)"
  OUT_DIR="$ROOT_DIR/backups/$TS"
fi

mkdir -p "$OUT_DIR"

cleanup() {
  echo "Останавливаю сервисы..."
  $COMPOSE_CMD -f "$COMPOSE_FILE" stop db backend || true
}
trap cleanup EXIT

$COMPOSE_CMD -f "$COMPOSE_FILE" up -d db backend

echo "Ожидание готовности базы данных..."
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c '\
i=0; \
while [ $i -lt 30 ]; do \
  pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1 && exit 0; \
  i=$((i+1)); \
  sleep 2; \
done; \
exit 1'

echo "Сохраняю дамп базы..."
TMP_DB_SQL="$(mktemp "$OUT_DIR/db.sql.tmp.XXXXXX")"
if ! $COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$TMP_DB_SQL"; then
  rm -f "$TMP_DB_SQL"
  exit 1
fi
mv "$TMP_DB_SQL" "$OUT_DIR/db.sql"

echo "Архивирую uploads..."
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T backend sh -c 'tar -C /app/backend/uploads -czf - .' > "$OUT_DIR/uploads.tar.gz"

cat <<INFO > "$OUT_DIR/manifest.txt"
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
compose_file=$COMPOSE_FILE
INFO

echo "Бэкап завершен: $OUT_DIR"
