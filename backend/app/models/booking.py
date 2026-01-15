"""
Модель бронирования
"""
from sqlalchemy import Column, String, Date, Time, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    service_type = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    status = Column(String, nullable=False, default="pending")
    calendly_event_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
