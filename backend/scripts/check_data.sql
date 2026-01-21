-- Проверка данных в базе данных

-- Проверка проектов
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_projects,
    COUNT(CASE WHEN display_order IS NULL THEN 1 END) as projects_without_order
FROM projects;

-- Список всех проектов
SELECT id, title, slug, is_featured, display_order, created_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- Проверка курсов
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN display_order IS NULL THEN 1 END) as courses_without_order
FROM courses;

-- Список всех курсов
SELECT id, title, slug, display_order, created_at 
FROM courses 
ORDER BY created_at DESC 
LIMIT 10;
