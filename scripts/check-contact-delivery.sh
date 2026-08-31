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

# Расшифровка кодов возврата curl — нужна, чтобы отличить
# «Telegram отказал» от «до Telegram вообще не достучались».
curl_reason() {
  case "$1" in
    0)  echo "успех" ;;
    5)  echo "не разрешается адрес прокси" ;;
    6)  echo "DNS не резолвит api.telegram.org" ;;
    7)  echo "соединение отклонено или отфильтровано" ;;
    28) echo "таймаут — пакеты уходят в никуда" ;;
    35) echo "TLS-рукопожатие не удалось (типично для блокировки по SNI)" ;;
    56) echo "соединение разорвано во время приёма данных" ;;
    *)  echo "код curl $1" ;;
  esac
}

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

# Частая причина «правильный токен не работает»: кавычки или пробелы
# из .env уезжают в значение как есть.
if [ -n "$TG_TOKEN" ]; then
  case "$TG_TOKEN" in
    \"*|\'*|*\"|*\')
      echo "  !! Токен обёрнут в кавычки — в .env их писать не нужно, они попадают в значение." ;;
  esac
  case "$TG_TOKEN" in
    *" "*) echo "  !! В токене есть пробел — вероятно, лишний символ при вставке." ;;
  esac
  if ! echo "$TG_TOKEN" | grep -qE '^[0-9]{6,}:[A-Za-z0-9_-]{30,}$'; then
    echo "  !! Токен не похож на формат Telegram (цифры, двоеточие, ~35 символов)."
  fi
fi

echo
echo "=============================================="
echo " 2. Есть ли связь с api.telegram.org"
echo "=============================================="
echo "  (проверяется БЕЗ токена — только сетевая доступность)"

PROBE_HTTP=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://api.telegram.org/" 2>/dev/null)
PROBE_RC=$?

if [ "$PROBE_RC" -eq 0 ]; then
  echo "  Связь есть (HTTP $PROBE_HTTP). Сеть не при чём."
  TG_REACHABLE=1
else
  TG_REACHABLE=0
  echo "  СВЯЗИ НЕТ: $(curl_reason "$PROBE_RC")"
  echo
  echo "  Это и есть причина. Токен ни при чём — до Telegram не доходят запросы"
  echo "  с этого сервера. С твоего компьютера тот же токен работает, потому что"
  echo "  проверка идёт из другой сети."
  echo
  echo "  Telegram заблокирован у большинства российских хостеров."
  echo "  Проверь отдельно, резолвится ли адрес:"
  echo "    getent hosts api.telegram.org"
fi

echo
echo "=============================================="
echo " 3. Проверка токена (getMe)"
echo "=============================================="

TOKEN_OK=0
if [ -z "$TG_TOKEN" ]; then
  echo "  TELEGRAM_BOT_TOKEN пуст внутри контейнера."
  echo "  Проверь, что он есть в $ROOT_DIR/.env, и перезапусти: $COMPOSE_CMD up -d $SERVICE"
elif [ "$TG_REACHABLE" -eq 0 ]; then
  echo "  Пропущено: нет связи с api.telegram.org (см. пункт 2)."
else
  GETME_BODY=$(mktemp)
  GETME_HTTP=$(curl -s -o "$GETME_BODY" -w '%{http_code}' --max-time 20 \
    "https://api.telegram.org/bot${TG_TOKEN}/getMe" 2>/dev/null)
  GETME_RC=$?
  GETME=$(cat "$GETME_BODY"); rm -f "$GETME_BODY"

  if [ "$GETME_RC" -ne 0 ]; then
    echo "  Запрос не дошёл: $(curl_reason "$GETME_RC")"
  elif [ -z "$GETME" ]; then
    echo "  Пустой ответ при HTTP $GETME_HTTP — похоже на фильтрацию трафика."
  elif echo "$GETME" | grep -q '"ok":true'; then
    BOT_NAME=$(echo "$GETME" | sed -n 's/.*"username":"\([^"]*\)".*/\1/p')
    echo "  Токен рабочий. Бот: @${BOT_NAME:-?}"
    TOKEN_OK=1
  else
    DESC=$(echo "$GETME" | sed -n 's/.*"description":"\([^"]*\)".*/\1/p')
    echo "  Telegram отклонил токен (HTTP $GETME_HTTP): ${DESC:-$GETME}"
    echo "  → Токен отозван или перевыпущен в @BotFather. Возьми актуальный."
  fi
fi

echo
echo "=============================================="
echo " 4. Отправка тестового сообщения в чат"
echo "=============================================="

if [ "$SEND_TEST" -eq 0 ]; then
  echo "  Пропущено (--no-send)."
elif [ "$TOKEN_OK" -eq 0 ]; then
  echo "  Пропущено: токен не подтверждён на шаге 3."
elif [ -z "$TG_CHAT" ]; then
  echo "  Пропущено: TELEGRAM_CHAT_ID пуст."
else
  SEND=$(curl -s --max-time 20 -X POST \
    "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    -d "{\"chat_id\":\"${TG_CHAT}\",\"text\":\"Проверка доставки заявок с сайта. Это тестовое сообщение.\"}" 2>/dev/null)

  if echo "$SEND" | grep -q '"ok":true'; then
    echo "  Сообщение доставлено в чат $TG_CHAT — канал полностью рабочий."
  else
    DESC=$(echo "$SEND" | sed -n 's/.*"description":"\([^"]*\)".*/\1/p')
    echo "  Telegram отказал: ${DESC:-${SEND:-пустой ответ}}"
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
    esac
  fi
fi

echo
echo "=============================================="
echo " 5. Последние ошибки доставки в логах"
echo "=============================================="

LOGS=$(compose logs --tail=500 "$SERVICE" 2>/dev/null | grep -F "Не удалось доставить" | tail -5)
if [ -n "$LOGS" ]; then
  echo "$LOGS" | cut -c1-400 | sed 's/^/  /'
else
  echo "  Ошибок доставки в последних 500 строках логов нет."
fi

echo
echo "Итог: заявка считается принятой, если сработал ХОТЯ БЫ ОДИН канал."
if [ "$TG_REACHABLE" -eq 0 ]; then
  echo "Telegram с этого сервера недоступен — как канал он здесь работать не будет,"
  echo "пока не появится прокси. Надёжнее переключиться на почту."
fi
