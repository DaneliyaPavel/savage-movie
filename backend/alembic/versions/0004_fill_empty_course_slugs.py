"""fill empty course slugs from title

Revision ID: 0004_fill_slugs
Revises: 0003_payments
Create Date: 2026-02-17

"""
import re
from alembic import op
from sqlalchemy import text


revision = '0004_fill_slugs'
down_revision = '0003_payments'
branch_labels = None
depends_on = None


def _slugify(title: str) -> str:
    s = (title or '').strip().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def upgrade() -> None:
    conn = op.get_bind()
    rows = conn.execute(
        text("SELECT id, title, slug FROM courses WHERE slug IS NULL OR slug = ''")
    ).fetchall()
    for row in rows:
        course_id, title, _ = row
        base_slug = _slugify(title) or 'course'
        slug = base_slug
        suffix = 0
        while True:
            existing = conn.execute(
                text("SELECT 1 FROM courses WHERE slug = :slug AND id != :id"),
                {'slug': slug, 'id': str(course_id)},
            ).fetchone()
            if not existing:
                break
            suffix += 1
            slug = f'{base_slug}-{suffix}'
        conn.execute(
            text("UPDATE courses SET slug = :slug WHERE id = :id"),
            {'slug': slug, 'id': str(course_id)},
        )


def downgrade() -> None:
    # Data migration: no reversible change
    pass
