"""
API роуты для записей на курсы
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.courses import SqlAlchemyCoursesRepository
from app.infrastructure.db.repositories.enrollments import SqlAlchemyEnrollmentsRepository
from app.interfaces.schemas.enrollment import Enrollment as EnrollmentSchema, EnrollmentCreate, EnrollmentUpdate
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])


@router.get("", response_model=List[EnrollmentSchema])
async def get_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить список записей пользователя на курсы"""
    repo = SqlAlchemyEnrollmentsRepository(db)
    return await repo.list_by_user(current_user.id)


@router.get("/{course_id}", response_model=EnrollmentSchema)
async def get_enrollment_by_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Проверить, записан ли пользователь на курс"""
    repo = SqlAlchemyEnrollmentsRepository(db)
    enrollment = await repo.get_by_user_and_course(current_user.id, course_id)
    
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
    course_repo = SqlAlchemyCoursesRepository(db)
    course = await course_repo.get_by_id(enrollment_data.course_id)
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    
    # Проверяем, не записан ли уже пользователь
    repo = SqlAlchemyEnrollmentsRepository(db)
    existing = await repo.get_by_user_and_course(current_user.id, enrollment_data.course_id)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже записаны на этот курс"
        )
    
    # Создаем запись
    return await repo.create(
        user_id=current_user.id,
        course_id=enrollment_data.course_id,
        progress=0,
    )


@router.put("/{enrollment_id}/progress", response_model=EnrollmentSchema)
async def update_enrollment_progress(
    enrollment_id: UUID,
    enrollment_data: EnrollmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить прогресс обучения"""
    repo = SqlAlchemyEnrollmentsRepository(db)
    enrollment = await repo.get_by_id_and_user(enrollment_id, current_user.id)
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запись на курс не найдена"
        )
    
    # Обновляем прогресс
    update_data = enrollment_data.model_dump(exclude_unset=True)
    return await repo.update(enrollment, update_data)
