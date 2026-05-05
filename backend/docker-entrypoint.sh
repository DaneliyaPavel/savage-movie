#!/bin/sh
set -e

# Bind-mounted uploads volume берёт ownership с хоста (обычно root:root),
# что ломает запись из контейнера, который бежит под appuser (uid=1001).
# Чиним до старта приложения. Контейнер запускается как root, затем сбрасываем
# привилегии через gosu на appuser.
if [ -d /app/backend/uploads ]; then
  mkdir -p /app/backend/uploads/images /app/backend/uploads/videos
  chown -R appuser:appuser /app/backend/uploads || true
fi

exec gosu appuser "$@"
