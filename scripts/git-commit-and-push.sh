#!/usr/bin/env bash
# Сбор изменений, коммит и пуш в Git.
# Запуск из корня проекта:
#   bash scripts/git-commit-and-push.sh
# или: chmod +x scripts/git-commit-and-push.sh && ./scripts/git-commit-and-push.sh

set -e
cd "$(dirname "$0")/.."

# Инициализация Git, если репозитория нет
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Инициализация Git-репозитория..."
  git init
fi

# Добавляем все изменения (учитывая .gitignore)
git add -A

# Проверка наличия изменений для коммита
if [ -z "$(git status --porcelain)" ]; then
  echo "Нет изменений для коммита."
  exit 0
fi

git status --short

# Коммит с сообщением по CHANGELOG (Unreleased)
COMMIT_MSG="chore: backend reorg, Alembic migrations, Docker updates

- Add Alembic migrations and config for backend DB
- Add repository layer for DB access
- Add ARCHITECTURE.md with layered model
- Docker Compose: run Alembic migrations on backend startup
- Backend: delivery/application/infrastructure/interfaces
- init-docker.sh: no longer generates .env, load from environment
- Remove legacy SQL bootstrap, Supabase refs, __v0_reference__"

git commit -m "$COMMIT_MSG"

# Пуш (требуется настроенный remote)
if git remote get-url origin > /dev/null 2>&1; then
  echo "Пуш в origin..."
  git push -u origin HEAD 2>/dev/null || git push origin HEAD
else
  echo "Remote 'origin' не задан. Добавьте его и запушьте вручную:"
  echo "  git remote add origin <URL>"
  echo "  git push -u origin main"
  echo "  # или: git push -u origin master"
fi
