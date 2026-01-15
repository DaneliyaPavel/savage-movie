-- Миграция для добавления полей Directors в таблицу clients
-- Запустить: psql -U postgres -d savage_movie -f backend/scripts/add_directors_fields.sql

-- Сначала создадим таблицу clients, если её нет (для совместимости)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем новые поля для Directors (если их ещё нет)
DO $$ 
BEGIN
  -- Добавляем slug, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='slug') THEN
    ALTER TABLE clients ADD COLUMN slug TEXT UNIQUE;
  END IF;

  -- Добавляем video_url, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='video_url') THEN
    ALTER TABLE clients ADD COLUMN video_url TEXT;
  END IF;

  -- Добавляем video_playback_id, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='video_playback_id') THEN
    ALTER TABLE clients ADD COLUMN video_playback_id TEXT;
  END IF;

  -- Добавляем portfolio_videos (JSONB), если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='portfolio_videos') THEN
    ALTER TABLE clients ADD COLUMN portfolio_videos JSONB;
  END IF;

  -- Добавляем bio, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='bio') THEN
    ALTER TABLE clients ADD COLUMN bio TEXT;
  END IF;

  -- Добавляем role, если его нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='clients' AND column_name='role') THEN
    ALTER TABLE clients ADD COLUMN role TEXT;
  END IF;
END $$;

-- Создаём индекс для slug (для быстрого поиска)
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug) WHERE slug IS NOT NULL;

-- Добавляем триггер для обновления updated_at для clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
