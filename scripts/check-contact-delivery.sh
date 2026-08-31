#!/bin/bash
# Диагностика доставки заявок с форм сайта (/api/contact).
# Запускать на сервере из корня проекта: ./scripts/check-contact-delivery.sh
#
# Скрипт НЕ печатает токен и ключи — только факт наличия и длину,
# поэтому вывод можно спокойно копировать в переписку.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
SERVICE="${SERVICE:-frontend}"
SEND_TEST=1

usage() {
  echo "Usage: $0 [--no-send]"
  echo "  --no-send   не отправлять тестовое сообщение в Telegram"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --no-send) SEND_TEST=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Неизвестный аргумент: $1"; usage; exit 1 ;;
  esac
done

COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
  if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
  else
    echo "Docker Compose не установлен."
    exit 1
  fi
fi

compose() { $COMPOSE_CMD -f "$COMPOSE_FILE" "$@"; }

echo "=============================================="
echo " 1. Переменные внутри контейнера $SERVICE"
echo "=============================================="

if ! compose ps --status running --services 2>/dev/null | grep -qx "$SERVICE"; then
  echo "Контейнер '$SERVICE' не запущен. Подними его: $COMPOSE_CMD up -d $SERVICE"
  exit 1
fi

# Читаем значения из контейнера — это единственный авторитетный источник.
# Наружу отдаём только длину, чтобы не светить секреты.
ENV_DUMP=$(compose exec -T "$SERVICE" sh -c '
for v in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID RESEND_API_KEY RESEND_FROM_EMAIL ADMIN_EMAIL; do
  eval "val=\${$v:-}"
  printf "%s\t%s\n" "$v" "$val"
done' 2>/dev/null | tr -d '\r')

if [ -z "$ENV_DUMP" ]; then
  echo "Не удалось прочитать окружение контейнера."
  exit 1
fi

get_var() { echo "$ENV_DUMP" | awk -F'\t' -v k="$1" '$1==k {print $2; exit}'; }

while IFS=$'\t' read -r name value; do
  [ -z "$name" ] && continue
  case "$name" in
    # Адреса не секретны — показываем как есть, их полезно видеть глазами
    ADMIN_EMAIL|RESEND_FROM_EMAIL|TELEGRAM_CHAT_ID)
      if [ -n "$value" ]; then echo "  $name = $value"; else echo "  $name = ПУСТО"; fi ;;
    *)
      if [ -n "$value" ]; then
        echo "  $name = задана (${#value} символов)"
      else
        echo "  $name = ПУСТО"
      fi ;;
  esac
done <<< "$ENV_DUMP"

TG_TOKEN=$(get_var TELEGRAM_BOT_TOKEN)
TG_CHAT=$(get_var TELEGRAM_CHAT_ID)

echo
echo "=============================================="
echo " 2. Проверка бота в Telegram API"
echo "=============================================="

if [ -z "$TG_TOKEN" ]; then
  echo "  TELEGRAM_BOT_TOKEN пуст внутри контейнера."
  echo "  Проверь, что он есть в $ROOT_DIR/.env, и перезапусти: $COMPOSE_CMD up -d $SERVICE"
else
  GETME=$(curl -s --max-time 15 "https://api.telegram.org/bot${TG_TOKEN}/getMe")
  if echo "$GETME" | grep -q '"ok":true'; then
    BOT_NAME=$(echo "$GETME" | sed -n 's/.*"username":"\([^"]*\)".*/\1/p')
    echo "  Токен рабочий. Бот: @${BOT_NAME:-?}"
  else
    echo "  Токен НЕ принят Telegram. Ответ API:"
    echo "$GETME" | sed 's/^/    /'
    echo "  Скорее всего токен отозван или перевыпущен в @BotFather."
  fi
fi

echo
echo "=============================================="
echo " 3. Отправка тестового сообщения в чат"
echo "=============================================="

if [ "$SEND_TEST" -eq 0 ]; then
  echo "  Пропущено (--no-send)."
elif [ -z "$TG_TOKEN" ] || [ -z "$TG_CHAT" ]; then
  echo "  Пропущено: нет токена или chat_id."
else
  SEND=$(curl -s --max-time 15 -X POST \
    "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    -d "{\"chat_id\":\"${TG_CHAT}\",\"text\":\"Проверка доставки заявок с сайта. Это тестовое сообщение.\"}")

  if echo "$SEND" | grep -q '"ok":true'; then
    echo "  Сообщение доставлено в чат $TG_CHAT — канал полностью рабочий."
  else
    DESC=$(echo "$SEND" | sed -n 's/.*"description":"\([^"]*\)".*/\1/p')
    echo "  Telegram отказал: ${DESC:-$SEND}"
    case "$DESC" in
      *"chat not found"*)
        echo "  → chat_id неверен. Напиши боту любое сообщение и возьми id из:"
        echo "    curl -s \"https://api.telegram.org/bot<ТОКЕН>/getUpdates\"" ;;
      *"upgraded to a supergroup"*)
        NEW_ID=$(echo "$SEND" | sed -n 's/.*"migrate_to_chat_id":\([-0-9][0-9]*\).*/\1/p')
        echo "  → Группа стала супергруппой, id изменился. Новый: ${NEW_ID:-см. ответ выше}"
        echo "    Пропиши его в TELEGRAM_CHAT_ID и перезапусти $SERVICE." ;;
      *"bot was blocked"*)
        echo "  → Бот заблокирован пользователем. Разблокируй его в чате." ;;
      *"not a member"*|*"kicked"*)
        echo "  → Бота удалили из группы. Добавь обратно." ;;
      *"Unauthorized"*)
        echo "  → Токен недействителен, перевыпусти в @BotFather." ;;
    esac
  fi
fi

echo
echo "=============================================="
echo " 4. Последние ошибки доставки в логах"
echo "=============================================="

LOGS=$(compose logs --tail=500 "$SERVICE" 2>/dev/null | grep -F "Не удалось доставить" | tail -5)
if [ -n "$LOGS" ]; then
  echo "$LOGS" | cut -c1-400 | sed 's/^/  /'
else
  echo "  Ошибок доставки в последних 500 строках логов нет."
fi

echo
echo "Итог: заявка считается принятой, если сработал ХОТЯ БЫ ОДИН канал."
echo "Если Telegram выше зелёный, форма на сайте уже работает."
