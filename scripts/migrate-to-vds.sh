#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="dev"
REMOTE_HOST=""
REMOTE_USER="root"
REMOTE_PATH="~/savage-movie"
BACKUP_DIR=""
NO_BUILD=0
RESTART_AFTER_RESTORE=1
UPDATE_REPO=0
UPDATE_BRANCH=""

usage() {
  echo "Usage: $0 --host <ip_or_domain> [--user <user>] [--path <remote_path>] [--backup <dir>] [--no-build] [--no-restart] [--update] [--branch <name>]"
  echo "Note: --dev/--prod оставлены для совместимости, сейчас используется одно окружение."
}

log_step() {
  echo "==> $STEP/$TOTAL_STEPS $1"
  STEP=$((STEP + 1))
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
    --host)
      REMOTE_HOST="${2:-}"
      shift 2
      ;;
    --user)
      REMOTE_USER="${2:-}"
      shift 2
      ;;
    --path)
      REMOTE_PATH="${2:-}"
      shift 2
      ;;
    --backup)
      BACKUP_DIR="$(make_abs_path "${2:-}")"
      shift 2
      ;;
    --dev)
      MODE="dev"
      shift
      ;;
    --prod)
      MODE="prod"
      shift
      ;;
    --no-build)
      NO_BUILD=1
      shift
      ;;
    --no-restart)
      RESTART_AFTER_RESTORE=0
      shift
      ;;
    --update)
      UPDATE_REPO=1
      shift
      ;;
    --branch)
      UPDATE_BRANCH="${2:-}"
      shift 2
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

TOTAL_STEPS=6
if [ "$UPDATE_REPO" -eq 1 ]; then
  TOTAL_STEPS=8
else
  TOTAL_STEPS=7
fi
STEP=1

if [ -z "$REMOTE_HOST" ]; then
  echo "Не указан --host"
  usage
  exit 1
fi

if ! command -v ssh &> /dev/null || ! command -v scp &> /dev/null; then
  echo "Нужны ssh и scp."
  exit 1
fi

if [ -z "$BACKUP_DIR" ]; then
  log_step "Создаю бэкап ($MODE)..."
  if [ "$MODE" = "prod" ]; then
    "$ROOT_DIR/scripts/backup.sh" --prod
  else
    "$ROOT_DIR/scripts/backup.sh" --dev
  fi
  BACKUP_DIR=$(ls -td "$ROOT_DIR"/backups/* | head -n 1)
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Каталог бэкапа не найден: $BACKUP_DIR"
  exit 1
fi

BACKUP_NAME=$(basename "$BACKUP_DIR")

log_step "Готовлю каталог на VDS..."
ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH/backups"

if [ "$UPDATE_REPO" -eq 1 ]; then
  log_step "Обновляю репозиторий на VDS..."
  if [ -n "$UPDATE_BRANCH" ]; then
    ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH && git fetch --all && git reset --hard origin/$UPDATE_BRANCH && chmod +x up scripts/*.sh"
  else
    ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH && git fetch --all && if git show-ref --verify --quiet refs/remotes/origin/main; then git reset --hard origin/main; elif git show-ref --verify --quiet refs/remotes/origin/master; then git reset --hard origin/master; else git reset --hard HEAD; fi && chmod +x up scripts/*.sh"
  fi
fi

log_step "Копирую бэкап на VDS..."
scp -r "$BACKUP_DIR" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/backups/"

log_step "Запускаю контейнеры и восстанавливаю данные на VDS..."
REMOTE_CMD="cd $REMOTE_PATH && ./up"
if [ "$NO_BUILD" -eq 1 ]; then
  REMOTE_CMD="$REMOTE_CMD --no-build"
fi
REMOTE_CMD="$REMOTE_CMD --restore backups/$BACKUP_NAME"
if [ "$RESTART_AFTER_RESTORE" -eq 1 ]; then
  REMOTE_CMD="$REMOTE_CMD --restart-after-restore"
fi

ssh "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_CMD"

log_step "Проверяю домен для итоговой ссылки..."
REMOTE_DOMAIN=$(ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH && if [ -f .env ]; then . ./.env >/dev/null 2>&1; echo \${APP_DOMAIN:-}; fi")

if [ -z "$REMOTE_DOMAIN" ]; then
  REMOTE_DOMAIN="$REMOTE_HOST"
fi

if [[ "$REMOTE_DOMAIN" == http://* || "$REMOTE_DOMAIN" == https://* ]]; then
  FINAL_URL="$REMOTE_DOMAIN"
else
  FINAL_URL="http://$REMOTE_DOMAIN"
fi

log_step "Проверяю доступность сайта..."
if command -v curl &> /dev/null; then
  OK=0
  for i in $(seq 1 30); do
    CODE=$(curl -o /dev/null -s -m 5 -w "%{http_code}" "$FINAL_URL" || true)
    if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 400 ]; then
      OK=1
      break
    fi
    sleep 2
  done
  if [ "$OK" -eq 1 ]; then
    echo "Проверка доступности: OK ($FINAL_URL)"
  else
    echo "Проверка доступности: FAIL (последний статус $CODE)"
  fi
else
  echo "curl не найден, проверку доступности пропускаю."
fi

log_step "Готово."
echo "Итоговая ссылка: $FINAL_URL"
