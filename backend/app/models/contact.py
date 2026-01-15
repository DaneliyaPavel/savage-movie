"""
Модель заявки с контактной формы
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    budget = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
