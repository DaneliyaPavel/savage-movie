# Инструкция по применению миграции

## Проблема
После добавления drag-and-drop функциональности курсы и проекты могут не отображаться, если миграция не применена.

## Решение

### 1. Применить SQL миграцию

Выполните следующую команду в терминале:

```bash
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie < backend/scripts/add_course_and_project_fields.sql
```

Или подключитесь к базе данных и выполните SQL вручную:

```sql
-- Добавление полей для курсов: level, certificate, format, display_order
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS level VARCHAR,
ADD COLUMN IF NOT EXISTS certificate VARCHAR,
ADD COLUMN IF NOT EXISTS format VARCHAR,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Добавление поля display_order для проектов
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Создание индексов для оптимизации сортировки
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON courses(display_order);
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);
```

### 2. Перезапустить backend

После применения миграции перезапустите backend контейнер:

```bash
docker-compose -f docker-compose.dev.yml restart backend
```

### 3. Проверить работу

Откройте сайт и проверьте:
- `/projects` - должны отображаться проекты
- `/courses` - должны отображаться курсы
- `/admin/projects` - должна работать drag-and-drop сортировка
- `/admin/courses` - должна работать drag-and-drop сортировка

## Если проблемы остались

1. Проверьте логи backend:
```bash
docker logs savage_movie_backend_dev
```

2. Проверьте логи frontend:
```bash
docker logs savage_movie_frontend_dev
```

3. Проверьте, что поля добавлены в БД:
```bash
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie -c "\d courses"
docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie -c "\d projects"
```
