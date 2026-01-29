# Руководство по проверке и восстановлению данных

## Симптомы

- Проекты/курсы не отображаются на сайте
- В админ‑панели нет данных

## Возможные причины

1. **База данных пересоздана без volume** — данные удалены
2. **Проблемы с сортировкой** — `display_order` пустой
3. **Проблема API** — backend не возвращает данные

---

## Проверка данных

### 1) Есть ли данные в базе?

```bash
docker exec -i savage_movie_db psql -U postgres -d savage_movie < backend/scripts/check_data.sql
```

Или вручную:

```bash
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "SELECT COUNT(*) FROM projects;"
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "SELECT COUNT(*) FROM courses;"
```

### 2) Данные есть, но не отображаются

**Причина: сортировка**

```sql
UPDATE projects SET display_order = 0 WHERE display_order IS NULL;
UPDATE courses SET display_order = 0 WHERE display_order IS NULL;
```

**Причина: API**

```bash
docker logs savage_movie_backend --tail 50
curl http://localhost:8001/api/projects
curl http://localhost:8001/api/courses
```

### 3) Данных нет

Проверьте наличие volume:

```bash
docker volume ls | grep savage
```

Если volume отсутствует или был удален — данные утеряны.

---

## Восстановление данных

### Рекомендуемый способ (скрипты)

Если у вас есть бэкап, созданный `./scripts/backup.sh`:

```bash
./scripts/restore.sh backups/<backup_dir>
```

Бэкап содержит:

- `db.sql`
- `uploads.tar.gz`

### Ручной способ

```bash
# База
docker exec -i savage_movie_db psql -U postgres -d savage_movie < backup.sql

# Uploads
docker exec -i savage_movie_backend sh -c "mkdir -p /app/backend/uploads"
# распаковка archives вручную по необходимости
```

---

## Профилактика

1. **Регулярные бэкапы**:

```bash
./scripts/backup.sh
```

2. **Не используйте** `docker-compose down -v` без необходимости.

3. Проверьте, что volume задан в `docker-compose.yml`:

```yaml
volumes:
  postgres_data_dev:
    driver: local
```
