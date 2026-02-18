"""add course_materials table

Revision ID: 0002_course_materials
Revises: c9151b3120aa
Create Date: 2026-02-17

"""
from alembic import op


revision = '0002_course_materials'
down_revision = 'c9151b3120aa'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE course_materials (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          material_type VARCHAR(20) NOT NULL DEFAULT 'link',
          file_url TEXT,
          external_url TEXT,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.create_index('ix_course_materials_course_id', 'course_materials', ['course_id'])
    op.create_index('ix_course_materials_lesson_id', 'course_materials', ['lesson_id'])


def downgrade() -> None:
    op.drop_table('course_materials')
