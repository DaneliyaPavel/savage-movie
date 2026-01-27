#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
TEMPLATE="$ROOT_DIR/infra/nginx/conf.d/app.conf.template"
OUT_FILE="$ROOT_DIR/infra/nginx/conf.d/app.conf"
HTTP_ONLY=0

usage() {
  echo "Usage: $0 [--http-only]"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --http-only)
      HTTP_ONLY=1
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

set -a
. "$ENV_FILE"
set +a

if [ -z "${APP_DOMAIN:-}" ]; then
  echo "APP_DOMAIN не задан в .env"
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "Шаблон Nginx не найден: $TEMPLATE"
  exit 1
fi

if [ "$HTTP_ONLY" -eq 1 ]; then
  cat > "$OUT_FILE" <<EOF_HTTP
server {
  listen 80;
  server_name ${APP_DOMAIN};

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    proxy_pass http://frontend:3000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto http;
  }
}
EOF_HTTP
else
  sed "s/{{DOMAIN}}/${APP_DOMAIN}/g" "$TEMPLATE" > "$OUT_FILE"
fi

echo "Nginx config generated: $OUT_FILE"
