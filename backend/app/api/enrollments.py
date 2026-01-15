"""
API роуты для записей на курсы
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.user import User
from app.schemas.enrollment import Enrollment as EnrollmentSchema, EnrollmentCreate, EnrollmentUpdate
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])


@router.get("", response_model=List[EnrollmentSchema])
async def get_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить список записей пользователя на курсы"""
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    enrollments = result.scalars().all()
    
    return enrollments


@router.get("/{course_id}", response_model=EnrollmentSchema)
async def get_enrollment_by_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Проверить, записан ли пользователь на курс"""
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        )
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вы не записаны на этот курс"
        )
    
    return enrollment


@router.post("", response_model=EnrollmentSchema, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Записаться на курс"""
    # Проверяем, существует ли курс
    result = await db.execute(select(Course).where(Course.id == enrollment_data.course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    
    # Проверяем, не записан ли уже пользователь
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == enrollment_data.course_id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже записаны на этот курс"
        )
    
    # Создаем запись
    new_enrollment = Enrollment(
        user_id=current_user.id,
        course_id=enrollment_data.course_id,
        progress=0
    )
    db.add(new_enrollment)
    await db.commit()
    await db.refresh(new_enrollment)
    
    return new_enrollment


@router.put("/{enrollment_id}/progress", response_model=EnrollmentSchema)
async def update_enrollment_progress(
    enrollment_id: UUID,
    enrollment_data: EnrollmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить прогресс обучения"""
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.id == enrollment_id,
            Enrollment.user_id == current_user.id
        )
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запись на курс не найдена"
        )
    
    # Обновляем прогресс
    update_data = enrollment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(enrollment, field, value)
    
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment
