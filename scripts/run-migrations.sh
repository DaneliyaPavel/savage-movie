#!/usr/bin/env bash
# Применить миграции Alembic (локально, без Docker).
# Запускать из корня проекта: ./scripts/run-migrations.sh
# Нужны: pip install -r backend/requirements.txt и настроенный .env в backend/ с DATABASE_URL.

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

if command -v alembic &>/dev/null; then
  alembic -c alembic.ini upgrade head
elif python3 -c "import alembic" 2>/dev/null; then
  python3 -m alembic -c alembic.ini upgrade head
elif python -c "import alembic" 2>/dev/null; then
  python -m alembic -c alembic.ini upgrade head
else
  echo "Alembic не найден. Установите зависимости: pip install -r backend/requirements.txt"
  echo "Или активируйте виртуальное окружение, где установлен alembic."
  exit 1
fi

echo "Миграции применены."
