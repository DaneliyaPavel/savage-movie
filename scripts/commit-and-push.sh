#!/usr/bin/env bash
# Собирает только нужные изменения в один коммит и пушит (без .claude и прочего мусора).
set -e
cd "$(dirname "$0")/.."

# Снять с индекса служебные файлы .claude
git reset HEAD .claude/ 2>/dev/null || true

# Добавить только нужные файлы
git add backend/app/config.py .gitignore

# Проверяем, что в индексе только они
echo "В коммит попадут:"
git diff --cached --name-only

# Коммит (Conventional Commits, прошлое время)
git commit -m "fix(backend): обновил конфигурацию и добавил .claude в gitignore"

# Подтянуть удалённые изменения и поставить наш коммит сверху (избегаем rejected push)
BRANCH=$(git branch --show-current)
echo ""
echo "Подтягиваю origin/$BRANCH (rebase)..."
git pull --rebase origin "$BRANCH"

git push origin "$BRANCH"
echo "Готово."
