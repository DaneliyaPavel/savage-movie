#!/usr/bin/env bash
# Интерактивный коммит и пуш в Git.
# Запуск:  npm run commit   или   npm run gc
# Альтернатива:  bash scripts/git-commit-and-push.sh

set -e
cd "$(dirname "$0")/.."

# ---- Цвета (если терминал поддерживает) ----
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED= GREEN= YELLOW= CYAN= BOLD= NC=
fi

print_step() { printf "\n${CYAN}${BOLD}▸ %s${NC}\n\n" "$1"; }
print_ok()   { printf "${GREEN}✓ %s${NC}\n" "$1"; }
print_warn() { printf "${YELLOW}%s${NC}\n" "$1"; }
print_err()  { printf "${RED}%s${NC}\n" "$1"; }

ask() {
  local default="$1" prompt="$2"
  local var
  if [ -n "$default" ]; then
    read -r -p "${prompt} [${default}]: " var
    echo "${var:-$default}"
  else
    read -r -p "${prompt} " var
    echo "$var"
  fi
}

confirm() {
  local default="${1:-y}" prompt="$2"
  local c
  read -r -p "${prompt} [${default}]: " c
  c=${c:-$default}
  c=$(echo "$c" | tr '[:upper:]' '[:lower:]')
  case "$c" in
    n|no|н|нет) return 1 ;;
    y|yes|yep|da|д|да) return 0 ;;
    *) [ "$default" = "y" ] ;;
  esac
}

# ---- 1. Git init и добавление файлов ----
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  print_step "Инициализация Git"
  git init
  print_ok "Репозиторий создан."
fi

print_step "Добавление изменений"
git add -A

if [ -z "$(git status --porcelain)" ]; then
  print_warn "Нет изменений для коммита. Рабочая директория чиста."
  exit 0
fi

echo "Изменённые файлы:"
git status --short
echo ""
if ! confirm "y" "Включить эти файлы в коммит? (y/n)"; then
  print_warn "Отменено."
  exit 0
fi

# ---- 2. Тип коммита ----
print_step "Тип коммита"
echo "  feat     — новая возможность"
echo "  fix      — исправление бага"
echo "  chore    — рутина, сборка, зависимости"
echo "  docs     — только документация"
echo "  style    — форматирование, без изменений логики"
echo "  refactor — рефакторинг кода"
echo ""
TYPE=$(ask "chore" "Тип (feat|fix|chore|docs|style|refactor):")

# ---- 3. Краткое описание (subject) ----
print_step "Краткое описание"
echo "Одна строка, до ~50 символов, без точки в конце. Например:"
echo "  «add Alembic migrations» или «fix contact form validation»"
echo ""
while true; do
  SUBJECT=$(ask "" "Краткое описание (обязательно):")
  SUBJECT=$(echo "$SUBJECT" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  if [ -n "$SUBJECT" ]; then break; fi
  print_err "Нельзя оставить пустым. Введи описание."
done

# ---- 4. Детали (body) ----
print_step "Детали коммита"
echo "Необязательно. Перечисли пункты, что сделано (каждый с новой строки)."
echo "Пустая строка — конец. Сразу Enter — пропустить."
echo ""
BODY=""
while read -r -p "> " line; do
  [ -z "$line" ] && break
  [ -n "$BODY" ] && BODY="$BODY"$'\n'"$line" || BODY="$line"
done

# ---- 5. Сборка сообщения и превью ----
if [ -n "$BODY" ]; then
  MSG="${TYPE}: ${SUBJECT}"$'\n\n'"${BODY}"
else
  MSG="${TYPE}: ${SUBJECT}"
fi

print_step "Превью коммита"
echo "----------------------------------------"
printf "${BOLD}%s${NC}\n" "$MSG"
echo "----------------------------------------"
echo ""
if ! confirm "y" "Всё верно? Коммитить? (y/n)"; then
  print_warn "Отменено. Коммит не создан."
  exit 0
fi

# ---- 6. Коммит ----
git commit -m "$MSG"
print_ok "Коммит создан: $(git rev-parse --short HEAD)"

# ---- 7. Пуш ----
print_step "Пуш в remote"
if ! git remote get-url origin > /dev/null 2>&1; then
  print_warn "Remote 'origin' не задан. Добавь и запушь вручную:"
  echo "  git remote add origin <URL>"
  echo "  git push -u origin \$(git branch --show-current)"
  exit 0
fi

echo "Origin: $(git remote get-url origin)"
echo ""
if ! confirm "y" "Пушить в origin? (y/n)"; then
  print_ok "Коммит сохранён локально. Пуш пропущен."
  exit 0
fi

if git push -u origin HEAD 2>/dev/null || git push origin HEAD; then
  print_ok "Успешно запушено в origin."
else
  print_err "Ошибка при пуше. Проверь remote и доступ."
  exit 1
fi

# ---- 8. PR в main (опционально) ----
# Алгоритм:
# 1) Проверяем, что текущая ветка НЕ main.
# 2) Проверяем наличие GitHub CLI (gh) и авторизацию.
# 3) Создаём PR в main с заголовком из коммита и телом из деталей.

create_pr() {
  local base="main"
  local branch
  branch="$(git branch --show-current)"
  if [ -z "$branch" ]; then
    print_err "Не удалось определить текущую ветку."
    return 1
  fi
  if [ "$branch" = "$base" ]; then
    print_warn "Вы на ветке main — PR не нужен."
    return 0
  fi
  if ! command -v gh &> /dev/null; then
    print_warn "GitHub CLI (gh) не установлен. Создай PR вручную."
    return 1
  fi
  if ! gh auth status -h github.com >/dev/null 2>&1; then
    print_warn "gh не авторизован. Выполни: gh auth login"
    return 1
  fi

  local pr_title pr_body
  pr_title="${TYPE}: ${SUBJECT}"
  pr_body="${BODY:-Авто PR}"

  gh pr create --base "$base" --head "$branch" --title "$pr_title" --body "$pr_body"
  print_ok "PR создан в ветку ${base}."
}

print_step "Pull Request"
if confirm "n" "Создать PR в main? (y/n)"; then
  if ! create_pr; then
    print_warn "PR не создан. Можно сделать вручную."
  fi
else
  print_ok "PR пропущен."
fi
