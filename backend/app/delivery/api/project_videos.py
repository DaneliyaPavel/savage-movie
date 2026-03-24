"""
API роуты для дополнительных видео проекта
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.project_videos import SqlAlchemyProjectVideosRepository
from app.infrastructure.db.repositories.projects import SqlAlchemyProjectsRepository
from app.infrastructure.db.session import get_db
from app.interfaces.schemas.project_video import (
    ProjectVideo as ProjectVideoSchema,
    ProjectVideoCreate,
    ProjectVideoUpdate,
)
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/projects/{project_id}/videos", tags=["project-videos"])


@router.get("", response_model=List[ProjectVideoSchema])
async def get_project_videos(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Получить дополнительные видео проекта"""
    repo = SqlAlchemyProjectVideosRepository(db)
    return await repo.list_by_project(project_id)


@router.post("", response_model=ProjectVideoSchema, status_code=status.HTTP_201_CREATED)
async def create_project_video(
    project_id: UUID,
    data: ProjectVideoCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Добавить видео к проекту (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут добавлять видео",
        )

    projects_repo = SqlAlchemyProjectsRepository(db)
    project = await projects_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Проект не найден",
        )

    repo = SqlAlchemyProjectVideosRepository(db)
    return await repo.create(project_id, data.model_dump())


@router.put("/{video_id}", response_model=ProjectVideoSchema)
async def update_project_video(
    project_id: UUID,
    video_id: UUID,
    data: ProjectVideoUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновить видео проекта (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут обновлять видео",
        )

    repo = SqlAlchemyProjectVideosRepository(db)
    video = await repo.get_by_id(video_id)
    if not video or video.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Видео не найдено",
        )

    update_data = data.model_dump(exclude_unset=True)
    return await repo.update(video, update_data)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_video(
    project_id: UUID,
    video_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить видео проекта (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут удалять видео",
        )

    repo = SqlAlchemyProjectVideosRepository(db)
    video = await repo.get_by_id(video_id)
    if not video or video.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Видео не найдено",
        )

    await repo.delete(video)
    return None
