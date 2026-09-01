"""add newsletter_subscribers table

Revision ID: 0009_newsletter
Revises: 0008_project_videos
Create Date: 2026-09-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = '0009_newsletter'
down_revision = '0008_project_videos'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'newsletter_subscribers',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('source', sa.String(length=64), nullable=True),
        sa.Column('language', sa.String(length=8), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('consent_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('unsubscribed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        'ix_newsletter_subscribers_email',
        'newsletter_subscribers',
        ['email'],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index('ix_newsletter_subscribers_email', table_name='newsletter_subscribers')
    op.drop_table('newsletter_subscribers')
