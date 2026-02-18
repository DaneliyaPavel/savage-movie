"""add course card fields and card_cover

Revision ID: 0005_card_fields
Revises: 0004_fill_slugs
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import JSONB, ARRAY


revision = '0005_card_fields'
down_revision = '0004_fill_slugs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('courses', sa.Column('short_description', sa.Text(), nullable=True))
    op.add_column('courses', sa.Column('duration_text', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('location_text', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('schedule_text', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('tags', ARRAY(Text), nullable=True))
    op.add_column('courses', sa.Column('badge_text', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('cta_text', sa.String(), nullable=True))
    op.add_column('courses', sa.Column('card_cover', JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column('courses', 'card_cover')
    op.drop_column('courses', 'cta_text')
    op.drop_column('courses', 'badge_text')
    op.drop_column('courses', 'tags')
    op.drop_column('courses', 'schedule_text')
    op.drop_column('courses', 'location_text')
    op.drop_column('courses', 'duration_text')
    op.drop_column('courses', 'short_description')
