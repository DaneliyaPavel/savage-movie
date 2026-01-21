-- Миграция для добавления таблицы blog_posts
-- Запустить: psql -U postgres -d savage_movie -f backend/scripts/add_blog_posts.sql

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  category TEXT,
  author TEXT,
  reading_time TEXT,
  content TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='blog_posts' AND column_name='excerpt') THEN
    ALTER TABLE blog_posts ADD COLUMN excerpt TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='blog_posts' AND column_name='category') THEN
    ALTER TABLE blog_posts ADD COLUMN category TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='blog_posts' AND column_name='author') THEN
    ALTER TABLE blog_posts ADD COLUMN author TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='blog_posts' AND column_name='reading_time') THEN
    ALTER TABLE blog_posts ADD COLUMN reading_time TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='blog_posts' AND column_name='content') THEN
    ALTER TABLE blog_posts ADD COLUMN content TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='blog_posts' AND column_name='is_published') THEN
    ALTER TABLE blog_posts ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='blog_posts' AND column_name='published_at') THEN
    ALTER TABLE blog_posts ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
