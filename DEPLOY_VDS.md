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

1) На сервере один раз настройте `.env` и выполните:
```bash
cd /root/opt/savagemovie/savage-movie
chmod +x up scripts/*.sh
```

2) В GitHub → Settings → Secrets and variables → Actions добавьте:
- `VDS_HOST` (например `89.169.4.92`)
- `VDS_USER` (например `root`)
- `VDS_SSH_KEY` (private key)
- `VDS_SSH_PORT` (необязательно, по умолчанию 22)
- `VDS_PATH` (например `/root/opt/savagemovie/savage-movie`)

После merge в `main` GitHub Action автоматически выполнит `scripts/deploy.sh`, обновит код и перезапустит контейнеры без кэша.

## Важно
- Не используйте `docker compose down -v`, иначе удалятся данные.
