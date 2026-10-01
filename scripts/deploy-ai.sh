#!/usr/bin/env bash
# Выкладка лендинга ai.savagemovie.ru (каталог sites/ai) на боевой сервер.
#
#   scripts/deploy-ai.sh preview    # выложить рядом как /next.html (noindex), боевой index.html не трогать
#   scripts/deploy-ai.sh live       # заменить боевой index.html текущей версией (с бэкапом и проверкой)
#   scripts/deploy-ai.sh rollback   # вернуть index.html из последнего бэкапа
#   scripts/deploy-ai.sh nginx      # обновить vhost из infra/nginx/conf.d и перезагрузить nginx (с откатом)
#
# Нужен SSH-доступ к серверу по ключу. Переменные окружения (значения по умолчанию в скобках):
#   AI_SSH         куда подключаться      (root@89.169.4.92)
#   AI_SSH_KEY     путь к приватному ключу (используется ключ из ssh-agent / ~/.ssh)
#   AI_WEBROOT     каталог страницы на сервере (/var/www/certbot/ai-landing)
#   AI_REPO_DIR    чекаут репозитория на сервере (/root/opt/savagemovie/savage-movie)
#   AI_NGINX       имя контейнера nginx    (savage_movie_nginx)
set -euo pipefail

AI_SSH="${AI_SSH:-root@89.169.4.92}"
AI_WEBROOT="${AI_WEBROOT:-/var/www/certbot/ai-landing}"
AI_REPO_DIR="${AI_REPO_DIR:-/root/opt/savagemovie/savage-movie}"
AI_NGINX="${AI_NGINX:-savage_movie_nginx}"
HOST="${AI_SSH#*@}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/sites/ai"
CONF_SRC="$ROOT/infra/nginx/conf.d/ai.savagemovie.ru.conf"
CONF_DST="$AI_REPO_DIR/infra/nginx/conf.d/ai.savagemovie.ru.conf"

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15)
if [ -n "${AI_SSH_KEY:-}" ]; then SSH_OPTS+=(-i "$AI_SSH_KEY" -o IdentitiesOnly=yes); fi

remote() { ssh "${SSH_OPTS[@]}" "$AI_SSH" "$@"; }
sync_to() { rsync -a -e "ssh ${SSH_OPTS[*]}" "$@"; }
check_url() { curl -fsS -m 20 --resolve "ai.savagemovie.ru:443:$HOST" "https://ai.savagemovie.ru/$1"; }

die() { echo "Ошибка: $*" >&2; exit 1; }

[ -f "$SRC/index.html" ] || die "нет $SRC/index.html"

backup() {
  local ts dir
  ts="$(date +%Y%m%d-%H%M%S)"
  dir="/root/backups/ai-$ts"
  # бэкап страницы строгий: если не получился, выкладка не начинается
  remote "mkdir -p '$dir' && cp -a '$AI_WEBROOT' '$dir/ai-landing'"
  # конфиг может быть ещё не под git на сервере: его отсутствие не ошибка
  remote "cp -a '$CONF_DST' '$dir/ai.savagemovie.ru.conf.orig' 2>/dev/null || true"
  echo "Бэкап на сервере: $dir" >&2
}

# всё, кроме index.html и служебных файлов: медиа, иконки, og-картинки, PDF
push_assets() {
  sync_to --exclude 'index.html' --exclude 'README.md' --exclude '.DS_Store' "$SRC/" "$AI_SSH:$AI_WEBROOT/"
}

case "${1:-}" in
  preview)
    backup
    push_assets
    tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
    # превью не должно попадать в поиск
    sed '0,/<meta charset="utf-8">/s//<meta charset="utf-8">\n<meta name="robots" content="noindex,nofollow">/' "$SRC/index.html" > "$tmp"
    grep -q 'noindex' "$tmp" || die "не удалось вставить noindex в превью"
    sync_to "$tmp" "$AI_SSH:$AI_WEBROOT/next.html"
    remote "chmod 644 '$AI_WEBROOT/next.html'"
    check_url next.html | grep -q 'data-enroll' || die "превью выложено, но форма на странице не найдена"
    echo "Превью: https://ai.savagemovie.ru/next.html"
    ;;

  live)
    backup
    push_assets
    # сначала во временный файл рядом, потом атомарная подмена
    sync_to "$SRC/index.html" "$AI_SSH:$AI_WEBROOT/index.html.new"
    remote "chmod 644 '$AI_WEBROOT/index.html.new' && mv '$AI_WEBROOT/index.html.new' '$AI_WEBROOT/index.html' && rm -f '$AI_WEBROOT/next.html'"
    check_url '' | grep -q 'data-enroll' || die "страница выложена, но форма на ней не найдена: запустите rollback"
    echo "Выложено: https://ai.savagemovie.ru/"
    ;;

  rollback)
    last="$(remote "ls -dt /root/backups/ai-*/ 2>/dev/null | head -1")"
    [ -n "$last" ] || die "бэкапов не найдено"
    remote "test -f '${last}ai-landing/index.html'" || die "в $last нет index.html"
    remote "cp -a '${last}ai-landing/index.html' '$AI_WEBROOT/index.html'"
    echo "index.html восстановлен из $last"
    ;;

  nginx)
    [ -f "$CONF_SRC" ] || die "нет $CONF_SRC"
    backup
    sync_to "$CONF_SRC" "$AI_SSH:/root/backups/ai.savagemovie.ru.conf.new"
    remote "set -e; prev=\$(mktemp); cat '$CONF_DST' > \"\$prev\" 2>/dev/null || true
      cat /root/backups/ai.savagemovie.ru.conf.new > '$CONF_DST'
      if docker exec '$AI_NGINX' nginx -t; then docker exec '$AI_NGINX' nginx -s reload && echo 'nginx перезагружен'
      else echo 'nginx -t не прошёл, возвращаю прежний конфиг'; cat \"\$prev\" > '$CONF_DST'; exit 1; fi"
    ;;

  *)
    sed -n '2,10p' "$0"
    exit 2
    ;;
esac
