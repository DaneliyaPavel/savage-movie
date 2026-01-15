-- Миграция для создания начальной схемы базы данных

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица проектов
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  client TEXT,
  category TEXT NOT NULL CHECK (category IN ('commercial', 'ai-content', 'music-video', 'other')),
  video_url TEXT,
  images TEXT[],
  duration INTEGER, -- в секундах
  role TEXT,
  tools TEXT[],
  behind_scenes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица курсов
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration INTEGER, -- в минутах
  cover_image TEXT,
  video_promo_url TEXT,
  instructor_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK (category IN ('ai', 'shooting', 'editing', 'production')),
  requirements TEXT[],
  what_you_learn TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица модулей курса
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица уроков
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  duration INTEGER, -- в секундах
  order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица записей на курсы
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- Таблица бронирований
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('consultation', 'shooting', 'production', 'training')),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  calendly_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица заявок с контактной формы
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  budget INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) политики

-- Включаем RLS для всех таблиц
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Политики для projects: все могут читать, только админы могут изменять
CREATE POLICY "Проекты доступны для чтения всем" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Только админы могут изменять проекты" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Политики для courses: все могут читать, только админы могут изменять
CREATE POLICY "Курсы доступны для чтения всем" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Только админы могут изменять курсы" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Политики для course_modules: все могут читать, только админы могут изменять
CREATE POLICY "Модули доступны для чтения всем" ON course_modules
  FOR SELECT USING (true);

CREATE POLICY "Только админы могут изменять модули" ON course_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Политики для lessons: все могут читать, только админы могут изменять
CREATE POLICY "Уроки доступны для чтения всем" ON lessons
  FOR SELECT USING (true);

CREATE POLICY "Только админы могут изменять уроки" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Политики для enrollments: пользователи могут видеть только свои записи
CREATE POLICY "Пользователи видят свои записи" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои записи" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои записи" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для bookings: пользователи могут видеть только свои бронирования
CREATE POLICY "Пользователи видят свои бронирования" ON bookings
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Пользователи могут создавать бронирования" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Политики для contact_submissions: только админы могут читать
CREATE POLICY "Только админы могут читать заявки" ON contact_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Все могут создавать заявки" ON contact_submissions
  FOR INSERT WITH CHECK (true);
