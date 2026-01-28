# Руководство по проверке и восстановлению данных

## Проблема
Проекты и курсы, созданные ранее, не отображаются на сайте.

## Возможные причины

1. **База данных была пересоздана** - при пересборке контейнеров без volume данные могли быть потеряны
2. **Проблема с сортировкой** - из-за нового поля `display_order` данные могут не отображаться
3. **Проблема с API** - запросы не возвращают данные

## Проверка данных

### 1. Проверьте, есть ли данные в базе данных

Выполните команду для проверки:

```bash
docker exec -i savage_movie_db psql -U postgres -d savage_movie < backend/scripts/check_data.sql
```

Или вручную:

```bash
# Проверка проектов
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "SELECT COUNT(*) FROM projects;"

# Проверка курсов
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "SELECT COUNT(*) FROM courses;"

# Список проектов
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "SELECT id, title, slug, is_featured FROM projects ORDER BY created_at DESC LIMIT 10;"

# Список курсов
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "SELECT id, title, slug FROM courses ORDER BY created_at DESC LIMIT 10;"
```

### 2. Если данные есть в базе, но не отображаются

#### Причина: Проблема с сортировкой

Исправьте сортировку, установив `display_order = 0` для всех существующих записей:

```sql
-- Установить display_order = 0 для всех проектов без порядка
UPDATE projects SET display_order = 0 WHERE display_order IS NULL;

-- Установить display_order = 0 для всех курсов без порядка
UPDATE courses SET display_order = 0 WHERE display_order IS NULL;
```

#### Причина: Проблема с API

Проверьте логи backend:

```bash
docker logs savage_movie_backend --tail 50
```

Проверьте, что API доступен:

```bash
curl http://localhost:8001/api/projects
curl http://localhost:8001/api/courses
```

### 3. Если данных нет в базе

#### Данные были потеряны при пересборке

Если база данных была пересоздана без volume, данные были потеряны. В этом случае нужно:

1. **Проверить, есть ли backup базы данных**

2. **Проверить volumes Docker**:
```bash
docker volume ls | grep savage
```

3. **Если volume существует, данные должны быть сохранены**

4. **Если volume не существует или был удален, данные потеряны**

## Восстановление данных

### Если есть backup

```bash
# Восстановить из backup
docker exec -i savage_movie_db psql -U postgres -d savage_movie < backup.sql
```

### Если backup нет

Данные нужно будет создать заново через админ-панель.

## Предотвращение потери данных в будущем

1. **Убедитесь, что volume настроен правильно** в `docker-compose.yml`:
```yaml
volumes:
  postgres_data_dev:
    driver: local
```

2. **Регулярно делайте backup**:
```bash
docker exec savage_movie_db pg_dump -U postgres savage_movie > backup_$(date +%Y%m%d_%H%M%S).sql
```

3. **Не используйте `docker-compose down -v`** без необходимости (это удаляет volumes)

## Быстрое исправление

Если данные есть, но не отображаются из-за сортировки, выполните:

```bash
docker exec -i savage_movie_db psql -U postgres -d savage_movie << EOF
UPDATE projects SET display_order = 0 WHERE display_order IS NULL;
UPDATE courses SET display_order = 0 WHERE display_order IS NULL;
EOF
```

Затем перезапустите backend:
```bash
docker-compose -f docker-compose.yml restart backend
```
