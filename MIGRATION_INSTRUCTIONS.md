# Инструкция по миграциям (Alembic)

## Когда нужно

Если после изменений схемы курсы/проекты не отображаются или admin drag-and-drop не работает, проверьте, что миграции Alembic применены.

## Для новой БД (рекомендуемый путь)

Локально (из корня проекта):

```bash
./scripts/run-migrations.sh
```

Скрипт подставляет `python3 -m alembic`, если команда `alembic` недоступна в PATH. Требуются установленные зависимости (`pip install -r backend/requirements.txt`) и настроенный `backend/.env` с `DATABASE_URL`.

Либо вручную:

```bash
alembic -c backend/alembic.ini upgrade head
# или, если alembic не в PATH:
python3 -m alembic -c backend/alembic.ini upgrade head
```

В Docker (backend контейнер; конфиг лежит в `/app/backend/`):

```bash
docker exec savage_movie_backend alembic -c /app/backend/alembic.ini upgrade head
```

Либо зайти в контейнер и запустить из рабочей директории:

```bash
docker exec -it savage_movie_backend sh -c "cd /app/backend && alembic -c alembic.ini upgrade head"
```

## Для существующей БД (созданной SQL-скриптами)

Если база уже создана старыми SQL-скриптами и соответствует текущей модели:

```bash
alembic -c backend/alembic.ini stamp head
```

Это пометит схему как актуальную без повторного создания таблиц.

## Проверка

Откройте сайт и проверьте:

- `/projects` - должны отображаться проекты
- `/courses` - должны отображаться курсы
- `/admin/projects` - должна работать drag-and-drop сортировка
- `/admin/courses` - должна работать drag-and-drop сортировка

## Если проблемы остались

1. Проверьте логи backend:

```bash
docker logs savage_movie_backend
```

2. Проверьте логи frontend:

```bash
docker logs savage_movie_frontend
```

3. Проверьте таблицы:

```bash
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "\d courses"
docker exec -i savage_movie_db psql -U postgres -d savage_movie -c "\d projects"
```
