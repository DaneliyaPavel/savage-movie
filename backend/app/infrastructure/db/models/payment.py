"""
Модель платежа за курс
"""
from sqlalchemy import Column, String, Numeric, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.infrastructure.db.session import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, succeeded, failed
    external_id = Column(String(255), nullable=True, index=True)  # YooKassa payment id
    created_at = Column(DateTime(timezone=True), server_default=func.now())
