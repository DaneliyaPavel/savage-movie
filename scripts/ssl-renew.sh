#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"

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

docker run --rm \
  -v "$ROOT_DIR/infra/letsencrypt:/etc/letsencrypt" \
  -v "$ROOT_DIR/infra/letsencrypt/www:/var/www/certbot" \
  certbot/certbot:latest renew
$COMPOSE_CMD -f "$COMPOSE_FILE" restart nginx

echo "SSL сертификаты обновлены"
