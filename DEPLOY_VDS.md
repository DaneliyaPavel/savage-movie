# VDS деплой (Docker)

Ниже короткие шаги, чтобы перенести проект на VDS и не потерять данные.

## 1) Сделать бэкап на текущем сервере/машине

```bash
./scripts/backup.sh
```

Папка с бэкапом появится в `backups/` (пример: `backups/20260127_120000`).
Скопируйте ее на VDS (например, через `scp`).

## 2) Подготовить VDS

```bash
# На VDS
git clone <repo>
cd savage-movie
cp .env.example .env
```

Отредактируйте `.env`:

- `NEXT_PUBLIC_API_URL` (например `http://<IP>:8001`)
- `NEXT_PUBLIC_APP_URL` (например `http://<IP>:3000`)
- `API_URL` (оставить `http://backend:8000`)
- `CORS_ORIGINS` (например `http://<IP>:3000`)
- `DB_PASSWORD` (иначе Postgres не стартует)
- ключи: Resend, YooKassa, Google/Yandex, Mux и т.д.

## 3) Запуск

```bash
./up
```

Сервисы поднимутся в Docker. Данные живут в volume `postgres_data_dev` и в папке `backend/uploads`.

## 4) Восстановить данные (проекты/курсы и т.д.)

```bash
./scripts/restore.sh backups/<ваш_бэкап>
```

## Быстрая миграция в одну команду

```bash
./scripts/migrate-to-vds.sh --host <ip_or_domain> --user <user> --path <remote_repo_path>
```

## Авто‑деплой при merge в main

1. На сервере один раз настройте `.env` и выполните:

```bash
cd /root/opt/savagemovie/savage-movie
chmod +x up scripts/*.sh
```

2. В GitHub → Settings → Secrets and variables → Actions добавьте:

- `VDS_HOST` (например `89.169.4.92`)
- `VDS_USER` (например `root`)
- `VDS_SSH_KEY` (private key)
- `VDS_SSH_PORT` (необязательно, по умолчанию 22)
- `VDS_PATH` (например `/root/opt/savagemovie/savage-movie`)
- `NEXT_PUBLIC_API_URL` (например `http://89.169.4.92:8001`)
- `NEXT_PUBLIC_APP_URL` (например `http://89.169.4.92:3000`)
- при необходимости остальные `NEXT_PUBLIC_*` переменные для сборки фронтенда

После merge в `main` GitHub Action соберет и загрузит Docker‑образы в GHCR, а сервер только сделает `pull` и перезапуск (быстро и без сборки на сервере).

## HTTP/2 на nginx: проверка после деплоя и откат

Строка `http2 on;` стоит в блоках `savagemovie.ru` и `www.savagemovie.ru` файла `infra/nginx/conf.d/default.conf` (и в `ai.savagemovie.ru.conf`). Нужен nginx 1.25.1 или новее.

Проверка после деплоя (с вашего компьютера):

```bash
curl -sI --http2 https://savagemovie.ru/ -o /dev/null -w 'http=%{http_version} code=%{http_code}\n'     # http=2 code=200
curl -sI --http1.1 https://savagemovie.ru/ -o /dev/null -w 'http=%{http_version} code=%{http_code}\n'   # http=1.1 code=200
curl -sI --http2 https://www.savagemovie.ru/ -o /dev/null -w 'http=%{http_version} code=%{http_code} -> %{redirect_url}\n'   # http=2 code=301 -> https://savagemovie.ru/
```

Откат. Быстро, на сервере (до следующего деплоя):

```bash
cd /root/opt/savagemovie/savage-movie
sed -i '/^    http2 on;$/d' infra/nginx/conf.d/default.conf
docker exec savage_movie_nginx nginx -t && docker exec savage_movie_nginx nginx -s reload
```

Это временно: `scripts/deploy.sh` делает `git reset --hard origin/main`, и при следующем деплое строки вернутся. Поэтому следом нужно смержить revert коммита с `http2 on;` в `main`.

## Важно

- Не используйте `docker compose down -v`, иначе удалятся данные.
