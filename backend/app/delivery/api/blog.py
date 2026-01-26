"""
API роуты для блога
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.delivery.api.auth import get_current_user
from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.blog import SqlAlchemyBlogRepository
from app.infrastructure.db.repositories.users import SqlAlchemyUsersRepository
from app.interfaces.schemas.blog import BlogPost as BlogPostSchema, BlogPostCreate, BlogPostUpdate
from app.application.services.auth_service import verify_token

router = APIRouter(prefix="/api/blog", tags=["blog"])
security = HTTPBearer(auto_error=False)

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        return None
    repo = SqlAlchemyUsersRepository(db)
    return await repo.get_by_id(token_data.user_id)


def estimate_reading_time(content: Optional[str]) -> Optional[str]:
    if not content:
        return None
    words = len(content.split())
    minutes = max(1, round(words / 200))
    return f"{minutes} мин"


@router.get("", response_model=List[BlogPostSchema])
async def get_posts(
    published: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить список статей"""
    if published is None:
        if not current_user or current_user.role != "admin":
            published = True
    if published is not None:
        if published is False and (not current_user or current_user.role != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для просмотра черновиков",
            )

    repo = SqlAlchemyBlogRepository(db)
    return await repo.list_posts(published, limit, offset)


@router.get("/{slug}", response_model=BlogPostSchema)
async def get_post_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Получить опубликованную статью по slug"""
    repo = SqlAlchemyBlogRepository(db)
    post = await repo.get_published_by_slug(slug)

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья не найдена")

    return post


@router.post("", response_model=BlogPostSchema, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: BlogPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Создать статью (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут создавать статьи",
        )

    repo = SqlAlchemyBlogRepository(db)
    existing = await repo.get_by_slug(post_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Статья с таким slug уже существует",
        )

    payload = post_data.model_dump()
    if not payload.get("reading_time"):
        payload["reading_time"] = estimate_reading_time(payload.get("content"))

    is_published = payload.get("is_published") is True
    if is_published and not payload.get("published_at"):
        payload["published_at"] = datetime.utcnow()
    if not is_published:
        payload["published_at"] = None

    return await repo.create(payload)


@router.put("/{post_id}", response_model=BlogPostSchema)
async def update_post(
    post_id: UUID,
    post_data: BlogPostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновить статью (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут обновлять статьи",
        )

    repo = SqlAlchemyBlogRepository(db)
    post = await repo.get_by_id(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья не найдена")

    update_data = post_data.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != post.slug:
        existing = await repo.get_by_slug(update_data["slug"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Статья с таким slug уже существует",
            )

    if "content" in update_data and not update_data.get("reading_time"):
        update_data["reading_time"] = estimate_reading_time(update_data.get("content"))

    if "is_published" in update_data:
        if update_data["is_published"] is True:
            if not update_data.get("published_at") and not post.published_at:
                update_data["published_at"] = datetime.utcnow()
        else:
            update_data["published_at"] = None

    return await repo.update(post, update_data)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить статью (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут удалять статьи",
        )

    repo = SqlAlchemyBlogRepository(db)
    post = await repo.get_by_id(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья не найдена")

    await repo.delete(post)
    return None
