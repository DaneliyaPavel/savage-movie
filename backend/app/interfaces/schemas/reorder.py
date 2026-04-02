"""
Pydantic schema для валидации запросов на изменение порядка элементов.
"""
from pydantic import BaseModel, Field
from uuid import UUID


class ReorderItem(BaseModel):
    id: UUID
    display_order: int = Field(ge=0)


class ReorderRequest(BaseModel):
    updates: list[ReorderItem] = Field(min_length=1, max_length=500)
