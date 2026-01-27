#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
BACKUP_DIR=""

usage() {
  echo "Usage: $0 [--prod|--dev|--compose <file>] <backup_dir>"
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
      COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
      shift
      ;;
    --dev)
      COMPOSE_FILE="$ROOT_DIR/docker-compose.dev.yml"
      shift
      ;;
    --compose)
      COMPOSE_FILE="$(make_abs_path "${2:-}")"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      BACKUP_DIR="$1"
      shift
      ;;
  esac
done

if [ -z "$BACKUP_DIR" ]; then
  echo "Не указан каталог бэкапа."
  usage
  exit 1
fi

BACKUP_DIR="$(make_abs_path "$BACKUP_DIR")"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose файл не найден: $COMPOSE_FILE"
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Каталог бэкапа не найден: $BACKUP_DIR"
  exit 1
fi

if [ ! -f "$BACKUP_DIR/db.sql" ] || [ ! -f "$BACKUP_DIR/uploads.tar.gz" ]; then
  echo "Бэкап неполный (ожидаются db.sql и uploads.tar.gz)."
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

$COMPOSE_CMD -f "$COMPOSE_FILE" up -d db backend

echo "Wait for database..."
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c '\
i=0; \
while [ $i -lt 30 ]; do \
  pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1 && exit 0; \
  i=$((i+1)); \
  sleep 2; \
done; \
exit 1'

echo "Recreate database..."
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c '\
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres -v target="$POSTGRES_DB" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = :'\''target'\'' AND pid <> pg_backend_pid();" \
&& dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB" \
&& createdb -U "$POSTGRES_USER" -O "$POSTGRES_USER" "$POSTGRES_DB"'

echo "Restore database..."
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$POSTGRES_DB"' < "$BACKUP_DIR/db.sql"

echo "Restore uploads..."
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T backend sh -c 'mkdir -p /app/backend/uploads'
$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T backend sh -c 'tar -xzf - -C /app/backend/uploads' < "$BACKUP_DIR/uploads.tar.gz"

echo "Restore completed."
