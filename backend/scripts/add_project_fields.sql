-- Миграция для добавления новых полей в таблицу projects
-- Запустить: docker exec -i savage_movie_db_dev psql -U postgres -d savage_movie -f /app/backend/scripts/add_project_fields.sql
-- Или: psql -U postgres -d savage_movie < backend/scripts/add_project_fields.sql

DO $$ 
BEGIN
  -- Добавляем is_featured, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='is_featured') THEN
    ALTER TABLE projects ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Добавляем mux_playback_id, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='mux_playback_id') THEN
    ALTER TABLE projects ADD COLUMN mux_playback_id TEXT;
  END IF;

  -- Добавляем title_ru, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='title_ru') THEN
    ALTER TABLE projects ADD COLUMN title_ru TEXT;
  END IF;

  -- Добавляем title_en, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='title_en') THEN
    ALTER TABLE projects ADD COLUMN title_en TEXT;
  END IF;

  -- Добавляем description_ru, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='description_ru') THEN
    ALTER TABLE projects ADD COLUMN description_ru TEXT;
  END IF;

  -- Добавляем description_en, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='description_en') THEN
    ALTER TABLE projects ADD COLUMN description_en TEXT;
  END IF;

  -- Добавляем thumbnail_url, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='thumbnail_url') THEN
    ALTER TABLE projects ADD COLUMN thumbnail_url TEXT;
  END IF;

  -- Добавляем cover_image_url, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='cover_image_url') THEN
    ALTER TABLE projects ADD COLUMN cover_image_url TEXT;
  END IF;

  -- Добавляем year, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='year') THEN
    ALTER TABLE projects ADD COLUMN year INTEGER;
  END IF;
END $$;

-- Создаём индекс для is_featured (для быстрого поиска featured проектов)
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured) WHERE is_featured = true;
