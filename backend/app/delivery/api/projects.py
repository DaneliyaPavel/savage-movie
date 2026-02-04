"""
API роуты для проектов
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID

from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.projects import SqlAlchemyProjectsRepository
from app.infrastructure.db.session import get_db
from app.interfaces.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=List[ProjectSchema])
async def get_projects(
    category: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Получить список проектов"""
    repo = SqlAlchemyProjectsRepository(db)
    return await repo.list_projects(category, featured, limit, offset)


@router.get("/{slug}", response_model=ProjectSchema)
async def get_project_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Получить проект по slug или ID"""
    repo = SqlAlchemyProjectsRepository(db)
    
    # Пробуем найти по UUID
    try:
        project_uuid = UUID(slug)
        project = await repo.get_by_id(project_uuid)
        if project:
            return project
    except ValueError:
        pass
        
    # Если не нашли по UUID, ищем по slug
    project = await repo.get_by_slug(slug)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Проект не найден"
        )
    
    return project


@router.post("", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать проект (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут создавать проекты"
        )
    
    # Проверяем, существует ли проект с таким slug
    repo = SqlAlchemyProjectsRepository(db)
    existing = await repo.get_by_slug(project_data.slug)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Проект с таким slug уже существует"
        )
    
    return await repo.create(project_data.model_dump())


@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить проект (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут обновлять проекты"
        )
    
    repo = SqlAlchemyProjectsRepository(db)
    project = await repo.get_by_id(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Проект не найден"
        )
    
    # Обновляем поля
    update_data = project_data.model_dump(exclude_unset=True)
    return await repo.update(project, update_data)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить проект (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут удалять проекты"
        )
    
    repo = SqlAlchemyProjectsRepository(db)
    project = await repo.get_by_id(project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Проект не найден"
        )
    
    await repo.delete(project)
    return None


@router.post("/reorder", status_code=status.HTTP_200_OK)
async def reorder_projects(
    updates: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить порядок проектов (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут изменять порядок проектов"
        )
    
    updates_list = updates.get("updates", [])
    repo = SqlAlchemyProjectsRepository(db)
    await repo.reorder(updates_list)
    return {"message": "Порядок проектов обновлен"}
