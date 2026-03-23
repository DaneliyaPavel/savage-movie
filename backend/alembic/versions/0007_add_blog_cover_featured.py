"""add blog cover_image and is_featured fields

Revision ID: 0007_blog_cover_featured
Revises: 0006_user_phone
Create Date: 2026-03-23

"""
from alembic import op
import sqlalchemy as sa


revision = '0007_blog_cover_featured'
down_revision = '0006_user_phone'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('blog_posts', sa.Column('cover_image', sa.Text(), nullable=True))
    op.add_column('blog_posts', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('blog_posts', 'is_featured')
    op.drop_column('blog_posts', 'cover_image')
