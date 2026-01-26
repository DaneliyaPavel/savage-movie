"""Initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2025-02-14

"""
from __future__ import annotations

from alembic import op

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def _execute_statements(statements: list[str]) -> None:
    for statement in statements:
        op.execute(statement.strip())


def upgrade() -> None:
    statements = [
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        """
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          full_name TEXT,
          avatar_url TEXT,
          provider TEXT NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'google', 'yandex')),
          provider_id TEXT,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          client TEXT,
          category TEXT NOT NULL CHECK (category IN ('commercial', 'ai-content', 'music-video', 'other')),
          video_url TEXT,
          orientation TEXT CHECK (orientation IN ('horizontal', 'vertical')),
          images TEXT[],
          duration INTEGER,
          role TEXT,
          tools TEXT[],
          behind_scenes TEXT[],
          is_featured BOOLEAN NOT NULL DEFAULT false,
          mux_playback_id TEXT,
          title_ru TEXT,
          title_en TEXT,
          description_ru TEXT,
          description_en TEXT,
          thumbnail_url TEXT,
          cover_image_url TEXT,
          year INTEGER,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE courses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          duration INTEGER,
          cover_image TEXT,
          video_promo_url TEXT,
          instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
          category TEXT NOT NULL CHECK (category IN ('ai', 'shooting', 'editing', 'production')),
          requirements TEXT[],
          what_you_learn TEXT[],
          level VARCHAR,
          certificate VARCHAR,
          format VARCHAR,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE course_modules (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          "order" INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE lessons (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          video_url TEXT,
          duration INTEGER,
          "order" INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE enrollments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
          enrolled_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          UNIQUE(user_id, course_id)
        );
        """,
        """
        CREATE TABLE bookings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          service_type TEXT NOT NULL CHECK (service_type IN ('consultation', 'shooting', 'production', 'training')),
          date DATE NOT NULL,
          time TIME NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
          calendly_event_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE contact_submissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          message TEXT NOT NULL,
          budget INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE clients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          logo_url TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
          slug TEXT UNIQUE,
          video_url TEXT,
          video_playback_id TEXT,
          portfolio_videos JSONB,
          bio TEXT,
          role TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE testimonials (
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
        """,
        """
        CREATE TABLE settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          key TEXT NOT NULL UNIQUE,
          value JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE blog_posts (
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
        """,
        "CREATE INDEX idx_users_email ON users(email);",
        "CREATE INDEX idx_users_provider ON users(provider, provider_id);",
        "CREATE INDEX idx_projects_slug ON projects(slug);",
        "CREATE INDEX idx_projects_category ON projects(category);",
        "CREATE INDEX idx_projects_is_featured ON projects(is_featured) WHERE is_featured = true;",
        "CREATE INDEX idx_projects_display_order ON projects(display_order);",
        "CREATE INDEX idx_courses_slug ON courses(slug);",
        "CREATE INDEX idx_courses_category ON courses(category);",
        "CREATE INDEX idx_courses_display_order ON courses(display_order);",
        "CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);",
        "CREATE INDEX idx_lessons_module_id ON lessons(module_id);",
        "CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);",
        "CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);",
        "CREATE INDEX idx_bookings_user_id ON bookings(user_id);",
        "CREATE INDEX idx_bookings_date ON bookings(date);",
        "CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);",
        'CREATE INDEX idx_clients_order ON clients("order");',
        "CREATE INDEX idx_clients_slug ON clients(slug) WHERE slug IS NOT NULL;",
        'CREATE INDEX idx_testimonials_order ON testimonials("order");',
        "CREATE INDEX idx_settings_key ON settings(key);",
        "CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);",
        "CREATE INDEX idx_blog_posts_published ON blog_posts(is_published);",
        "CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);",
        """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        """,
        """
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        """
        CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        """
        CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        """
        CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        """
        CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        """
        CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        """
        CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
    ]
    _execute_statements(statements)


def downgrade() -> None:
    statements = [
        "DROP TABLE IF EXISTS blog_posts;",
        "DROP TABLE IF EXISTS settings;",
        "DROP TABLE IF EXISTS testimonials;",
        "DROP TABLE IF EXISTS clients;",
        "DROP TABLE IF EXISTS contact_submissions;",
        "DROP TABLE IF EXISTS bookings;",
        "DROP TABLE IF EXISTS enrollments;",
        "DROP TABLE IF EXISTS lessons;",
        "DROP TABLE IF EXISTS course_modules;",
        "DROP TABLE IF EXISTS courses;",
        "DROP TABLE IF EXISTS projects;",
        "DROP TABLE IF EXISTS users;",
        "DROP FUNCTION IF EXISTS update_updated_at_column();",
    ]
    _execute_statements(statements)
