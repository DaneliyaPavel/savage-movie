"""
Модель статьи блога
"""
from sqlalchemy import Column, Text, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False, index=True)
    excerpt = Column(Text, nullable=True)
    category = Column(Text, nullable=True)
    author = Column(Text, nullable=True)
    reading_time = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    is_published = Column(Boolean, nullable=False, default=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
