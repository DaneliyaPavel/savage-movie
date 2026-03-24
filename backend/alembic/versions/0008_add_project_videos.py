"""add project_videos table

Revision ID: 0008_project_videos
Revises: 0007_blog_cover_featured
Create Date: 2026-03-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = '0008_project_videos'
down_revision = '0007_blog_cover_featured'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'project_videos',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.Text(), nullable=True),
        sa.Column('mux_playback_id', sa.Text(), nullable=False),
        sa.Column('orientation', sa.String(), nullable=False, server_default='horizontal'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('project_videos')
