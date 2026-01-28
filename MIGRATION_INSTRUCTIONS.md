# Инструкция по миграциям (Alembic)

## Когда нужно
Если после изменений схемы курсы/проекты не отображаются или admin drag-and-drop не работает, проверьте, что миграции Alembic применены.

## Для новой БД (рекомендуемый путь)

Локально:
```bash
alembic -c backend/alembic.ini upgrade head
```

В Docker (backend контейнер):
```bash
docker exec savage_movie_backend alembic -c /app/backend/alembic.ini upgrade head
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
