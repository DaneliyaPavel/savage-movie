"""
API роуты для отзывов
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.testimonials import SqlAlchemyTestimonialsRepository
from app.interfaces.schemas.testimonial import Testimonial as TestimonialSchema, TestimonialCreate, TestimonialUpdate
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/testimonials", tags=["testimonials"])


@router.get("", response_model=List[TestimonialSchema])
async def get_testimonials(
    db: AsyncSession = Depends(get_db)
):
    """Получить список отзывов"""
    repo = SqlAlchemyTestimonialsRepository(db)
    return await repo.list_testimonials()


@router.post("", response_model=TestimonialSchema, status_code=status.HTTP_201_CREATED)
async def create_testimonial(
    testimonial_data: TestimonialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать отзыв (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут создавать отзывы"
        )
    
    repo = SqlAlchemyTestimonialsRepository(db)
    return await repo.create(testimonial_data.model_dump())


@router.put("/{testimonial_id}", response_model=TestimonialSchema)
async def update_testimonial(
    testimonial_id: UUID,
    testimonial_data: TestimonialUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить отзыв (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут обновлять отзывы"
        )
    
    repo = SqlAlchemyTestimonialsRepository(db)
    testimonial = await repo.get_by_id(testimonial_id)
    
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден"
        )
    
    # Обновляем поля
    update_data = testimonial_data.model_dump(exclude_unset=True)
    return await repo.update(testimonial, update_data)


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimonial(
    testimonial_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить отзыв (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут удалять отзывы"
        )
    
    repo = SqlAlchemyTestimonialsRepository(db)
    testimonial = await repo.get_by_id(testimonial_id)
    
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден"
        )
    
    await repo.delete(testimonial)
    return None
