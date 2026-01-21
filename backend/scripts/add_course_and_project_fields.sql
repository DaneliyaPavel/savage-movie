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
