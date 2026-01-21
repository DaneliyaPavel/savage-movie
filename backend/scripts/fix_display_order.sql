-- Исправление display_order для существующих записей
-- Устанавливает display_order = 0 для всех записей, где он NULL

-- Для проектов
UPDATE projects 
SET display_order = 0 
WHERE display_order IS NULL;

-- Для курсов
UPDATE courses 
SET display_order = 0 
WHERE display_order IS NULL;

-- Проверка результата
SELECT 'Projects updated:' as info, COUNT(*) as count FROM projects WHERE display_order = 0;
SELECT 'Courses updated:' as info, COUNT(*) as count FROM courses WHERE display_order = 0;
