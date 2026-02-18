"""
API роуты для материалов курса
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.course_materials import SqlAlchemyCourseMaterialsRepository
from app.infrastructure.db.repositories.enrollments import SqlAlchemyEnrollmentsRepository
from app.interfaces.schemas.course_material import (
    CourseMaterial as CourseMaterialSchema,
    CourseMaterialCreate,
    CourseMaterialUpdate,
)
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/course-materials", tags=["course-materials"])


async def _can_access_course_materials(
    user: User, course_id: UUID, db: AsyncSession
) -> bool:
    if user.role == "admin":
        return True
    repo = SqlAlchemyEnrollmentsRepository(db)
    enrollment = await repo.get_by_user_and_course(user.id, course_id)
    return enrollment is not None


@router.get("", response_model=List[CourseMaterialSchema])
async def list_materials(
    course_id: UUID = Query(..., description="ID курса"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список материалов курса (доступно записанным и админам)"""
    can = await _can_access_course_materials(current_user, course_id, db)
    if not can:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к материалам курса",
        )
    repo = SqlAlchemyCourseMaterialsRepository(db)
    return await repo.list_by_course(course_id)


@router.post("", response_model=CourseMaterialSchema, status_code=status.HTTP_201_CREATED)
async def create_material(
    data: CourseMaterialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Добавить материал (только админ)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут добавлять материалы",
        )
    repo = SqlAlchemyCourseMaterialsRepository(db)
    return await repo.create(data.model_dump())


@router.put("/{material_id}", response_model=CourseMaterialSchema)
async def update_material(
    material_id: UUID,
    data: CourseMaterialUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновить материал (только админ)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут редактировать материалы",
        )
    repo = SqlAlchemyCourseMaterialsRepository(db)
    material = await repo.get_by_id(material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Материал не найден",
        )
    return await repo.update(material, data.model_dump(exclude_unset=True))


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить материал (только админ)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут удалять материалы",
        )
    repo = SqlAlchemyCourseMaterialsRepository(db)
    material = await repo.get_by_id(material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Материал не найден",
        )
    await repo.delete(material)
