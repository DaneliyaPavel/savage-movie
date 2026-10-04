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

# Проверка имени БД (is_valid_db_name): имя из Postgres нельзя писать в .env без неё
DB_NAME_LIB="$ROOT_DIR/scripts/lib/validate-db-name.sh"
if [ ! -f "$DB_NAME_LIB" ]; then
  echo "Не найден $DB_NAME_LIB: без проверки имени БД не продолжаю."
  exit 1
fi
# shellcheck source=lib/validate-db-name.sh
. "$DB_NAME_LIB"

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
    if ! is_valid_db_name "$detected_db"; then
      warn_invalid_db_name "$detected_db"
      return 0
    fi
    write_env_var "DB_NAME" "$detected_db"
    echo "ℹ️  DB_NAME не был задан. Установлен из текущей базы: $detected_db"
    return 0
  fi

  if [ -n "$current_db_name" ]; then
    if ! echo "$db_names" | grep -qx "$current_db_name"; then
      if [ "$db_count" -eq 1 ]; then
        local detected_db
        detected_db=$(echo "$db_names" | head -n 1)
        if ! is_valid_db_name "$detected_db"; then
          warn_invalid_db_name "$detected_db"
          return 0
        fi
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

# .env исполняется как shell (source ниже). Если в нём уже лежит чужая подстановка
# (например, записанная прежней версией скрипта), второй раз её запускать нельзя:
# останавливаем деплой до source. Сайт при этом работает на прежней версии.
if unsafe_db_name=$(find_unsafe_db_name_in_env "$ENV_FILE"); then
  echo "В $ENV_FILE у DB_NAME небезопасное значение: $unsafe_db_name"
  echo "Файл исполняется как shell, поэтому деплой остановлен до этого. Задай в .env DB_NAME"
  echo "обычным именем базы (буквы, цифры, _), проверь пользователей и базы в Postgres и повтори."
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

# Логин в registry (если задан). REGISTRY может содержать namespace
# (например, "ghcr.io/daneliyapavel"), а docker login ждёт только host.
if [ -n "${REGISTRY_USER:-}" ] && [ -n "${REGISTRY_TOKEN:-}" ]; then
  REGISTRY_HOST="${REGISTRY:-ghcr.io}"
  REGISTRY_HOST="${REGISTRY_HOST%%/*}"
  echo "$REGISTRY_TOKEN" | docker login "$REGISTRY_HOST" -u "$REGISTRY_USER" --password-stdin
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

# Проверка конфига nginx (nginx -t) до того, как он будет применён. Опечатка в
# infra/nginx/conf.d/default.conf иначе уронила бы весь сайт: restart убивает работающий
# nginx, а новый не поднимается; то же происходит, когда up -d пересоздаёт контейнер
# (вышел новый образ nginx:alpine). Каталог conf.d смонтирован в контейнер целиком, поэтому
# работающий nginx уже видит файлы после git reset.
#
# Два способа проверки, оба дают вердикт nginx (строки "nginx: ..."):
#  - одноразовый контейнер того же сервиса (те же образ и тома, без портов и зависимостей):
#    берёт образ, который только что скачал pull, то есть тот nginx, на котором контейнер
#    окажется после up -d;
#  - docker exec в работающем контейнере: проверяет бинарник, который будет перезапущен.
# До up -d важен первый способ (старый контейнер ещё на прежнем образе), после up -d и
# перед restart — второй. Если способ не дал вердикта (docker упал сам, контейнер как раз
# перезапускается), берём другой. Статусы: 0 прошёл, 1 не прошёл, 2 вердикта нет.
NGINX_CONTAINER="savage_movie_nginx"

nginx_test_fresh_container() {
  local output
  if output=$($COMPOSE_CMD -f "$COMPOSE_FILE" run --rm -T --no-deps --entrypoint nginx nginx -t 2>&1); then
    echo "$output"
    return 0
  fi
  echo "$output"
  case "$output" in
    *"nginx: "*) return 1 ;;
  esac
  return 2
}

nginx_test_running_container() {
  local output
  if [ "$(docker inspect -f '{{.State.Status}}' "$NGINX_CONTAINER" 2>/dev/null || true)" != "running" ]; then
    return 2
  fi
  if output=$(docker exec "$NGINX_CONTAINER" nginx -t 2>&1); then
    echo "$output"
    return 0
  fi
  echo "$output"
  case "$output" in
    *"nginx: "*) return 1 ;;
  esac
  return 2
}

# $1: pre или post. Печатает вывод проверки, код возврата 0 только если конфиг прошёл
run_nginx_config_test() {
  local first="nginx_test_fresh_container"
  local second="nginx_test_running_container"
  if [ "$1" = "post" ]; then
    first="nginx_test_running_container"
    second="nginx_test_fresh_container"
  fi

  local output
  local status=0
  output=$($first) || status=$?
  if [ "$status" -ne 2 ]; then
    echo "$output"
    return "$status"
  fi

  status=0
  output=$($second) || status=$?
  echo "$output"
  return "$status"
}

# Единственная допустимая «ошибка» до up -d: frontend или backend не запущены, и nginx -t
# не находит их по имени. Любое другое имя (опечатка вроде fronted) или любая другая
# ошибка конфига допуском не считаются. nginx останавливается на первой ошибке, поэтому
# опечатка после непознанного frontend проявится только в проверке после up -d.
only_stopped_services_missing() {
  local output="$1"
  local host
  local found=0
  local errors
  errors=$(printf '%s\n' "$output" | grep -c '\[emerg\]' || true)

  while IFS= read -r host; do
    [ -n "$host" ] || continue
    case "$host" in
      frontend|backend) found=$((found + 1)) ;;
      *) return 1 ;;
    esac
  done < <(printf '%s\n' "$output" | sed -n 's/.*host not found in upstream "\([^"]*\)".*/\1/p')

  [ "$found" -gt 0 ] && [ "$found" -eq "$errors" ]
}

# $1: pre (до up -d) или post (после up -d, перед restart)
check_nginx_config() {
  local stage="$1"
  local output
  if output=$(run_nginx_config_test "$stage"); then
    echo "Конфиг nginx проверен (nginx -t): ошибок нет."
    return 0
  fi

  # До up -d frontend/backend могут быть остановлены, и nginx -t не найдёт upstream:
  # это не ошибка конфига. Перепроверим после запуска сервисов.
  if [ "$stage" = "pre" ] && only_stopped_services_missing "$output"; then
    echo "nginx -t не нашёл frontend/backend (сервисы не запущены), проверю ещё раз после запуска."
    return 0
  fi

  echo "$output"
  echo "Конфиг nginx не прошёл проверку (nginx -t). nginx не перезапускаю: он продолжает работать на прежнем конфиге."
  echo "Исправь infra/nginx/conf.d/ и запусти деплой заново."
  exit 1
}

check_nginx_config pre

$COMPOSE_CMD -f "$COMPOSE_FILE" up -d --remove-orphans --no-build

# Контейнеры могли пересоздаться, поэтому перед перезапуском конфиг проверяем ещё раз
check_nginx_config post

# Force restart nginx to pick up volume-mounted config changes
echo "Restarting nginx to apply config changes..."
$COMPOSE_CMD -f "$COMPOSE_FILE" restart nginx

if [ "$PRUNE" -eq 1 ]; then
  docker image prune -f || true
fi

echo "Deploy completed."
