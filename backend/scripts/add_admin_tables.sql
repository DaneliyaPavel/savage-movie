-- Миграция для добавления таблиц админ-панели
-- Запустить этот скрипт после init_db.sql

-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  project_type TEXT,
  text TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  video_url TEXT,
  video_playback_id TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица настроек сайта
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_clients_order ON clients("order");
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials("order");
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Вставляем начальные настройки
INSERT INTO settings (key, value) VALUES
  ('hero_video_url', NULL),
  ('hero_video_playback_id', NULL),
  ('stats_projects', '100'),
  ('stats_clients', '50'),
  ('stats_years', '15')
ON CONFLICT (key) DO NOTHING;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
