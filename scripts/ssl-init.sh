#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Файл .env не найден: $ENV_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -z "${APP_DOMAIN:-}" ]; then
  echo "APP_DOMAIN не задан в .env"
  exit 1
fi

if [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
  echo "LETSENCRYPT_EMAIL не задан в .env"
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

mkdir -p "$ROOT_DIR/infra/letsencrypt/www"

"$ROOT_DIR/scripts/nginx-generate.sh" --http-only
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d nginx

echo "Requesting Let's Encrypt certificate for $APP_DOMAIN..."
docker run --rm \
  -v "$ROOT_DIR/infra/letsencrypt:/etc/letsencrypt" \
  -v "$ROOT_DIR/infra/letsencrypt/www:/var/www/certbot" \
  certbot/certbot:latest \
  certonly --webroot \
  -w /var/www/certbot \
  -d "$APP_DOMAIN" \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos \
  --no-eff-email

"$ROOT_DIR/scripts/nginx-generate.sh"
$COMPOSE_CMD -f "$COMPOSE_FILE" restart nginx

echo "SSL настроен для домена $APP_DOMAIN"
