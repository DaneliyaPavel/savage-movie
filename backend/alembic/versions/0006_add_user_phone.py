"""add user phone

Revision ID: 0006_user_phone
Revises: 0005_card_fields
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0006_user_phone'
down_revision = '0005_card_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'phone')
