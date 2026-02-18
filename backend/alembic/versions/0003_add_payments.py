"""add payments table

Revision ID: 0003_payments
Revises: 0002_course_materials
Create Date: 2026-02-17

"""
from alembic import op


revision = '0003_payments'
down_revision = '0002_course_materials'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          external_id VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.create_index('ix_payments_user_id', 'payments', ['user_id'])
    op.create_index('ix_payments_course_id', 'payments', ['course_id'])
    op.create_index('ix_payments_external_id', 'payments', ['external_id'])


def downgrade() -> None:
    op.drop_table('payments')
