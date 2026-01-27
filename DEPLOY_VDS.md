# VDS деплой (Docker)

Ниже короткие шаги, чтобы перенести проект на VDS и не потерять данные.

## 1) Сделать бэкап на текущем сервере/машине

```bash
./scripts/backup.sh --prod
```

Если данные сейчас в dev-контейнерах, используйте:

```bash
./scripts/backup.sh --dev
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
- `APP_DOMAIN` и `LETSENCRYPT_EMAIL`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` и `API_URL`
- `CORS_ORIGINS` (должен совпадать с доменом)
- ключи: Resend, YooKassa, Google/Yandex, Mux и т.д.

Если SSL пока не нужен, можно задать `APP_DOMAIN` как IP VDS и просто запустить `./up`.

## 3) Запуск продакшн-версии (без SSL)

```bash
./up
```

Сервисы поднимутся в Docker. Данные живут в volumes `postgres_data_prod` и `backend_uploads`.

## 4) SSL (Nginx + Let's Encrypt) — опционально, можно позже

```bash
./scripts/ssl-init.sh
```

Обновление сертификата:

```bash
./scripts/ssl-renew.sh
```

## 5) Восстановить данные (проекты/курсы и т.д.)

```bash
./scripts/restore.sh --prod backups/<ваш_бэкап>
```

## Быстрая миграция в одну команду

```bash
./scripts/migrate-to-vds.sh --host <ip_or_domain> --user <user> --path <remote_repo_path> --dev
```

## Важно
- Не используйте `docker compose down -v`, иначе удалятся данные.
- База в prod доступна только с localhost (`127.0.0.1:${DB_PORT:-5433}`) — это безопаснее.
