"""
API роуты для проектов
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID

from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from app.api.auth import get_current_user

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
    query = select(Project)
    
    if category and category != "all":
        query = query.where(Project.category == category)
    
    if featured is not None:
        query = query.where(Project.is_featured == featured)
    
    # Сортируем по display_order (если есть), затем по created_at
    # NULL значения идут первыми (0), затем по возрастанию display_order
    query = query.order_by(
        func.coalesce(Project.display_order, 0).asc(),
        Project.created_at.desc()
    ).limit(limit).offset(offset)
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return projects


@router.get("/{slug}", response_model=ProjectSchema)
async def get_project_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Получить проект по slug"""
    result = await db.execute(select(Project).where(Project.slug == slug))
    project = result.scalar_one_or_none()
    
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
    result = await db.execute(select(Project).where(Project.slug == project_data.slug))
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Проект с таким slug уже существует"
        )
    
    new_project = Project(**project_data.model_dump())
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return new_project


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
    
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Проект не найден"
        )
    
    # Обновляем поля
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    
    return project


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
    
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Проект не найден"
        )
    
    await db.delete(project)
    await db.commit()
    
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
    
    for update in updates_list:
        project_id = UUID(update["id"])
        display_order = update["display_order"]
        
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        
        if project:
            project.display_order = display_order
    
    await db.commit()
    
    return {"message": "Порядок проектов обновлен"}
