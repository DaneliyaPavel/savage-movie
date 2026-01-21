"""
API роуты для блога
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.blog_post import BlogPost
from app.models.user import User
from app.schemas.blog import BlogPost as BlogPostSchema, BlogPostCreate, BlogPostUpdate
from app.services.auth_service import verify_token

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
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    return result.scalar_one_or_none()


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
    query = select(BlogPost)

    if published is None:
        if not current_user or current_user.role != "admin":
            published = True
    if published is not None:
        if published is False and (not current_user or current_user.role != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для просмотра черновиков",
            )
        query = query.where(BlogPost.is_published == published)

    query = query.order_by(
        func.coalesce(BlogPost.published_at, BlogPost.created_at).desc(),
        BlogPost.created_at.desc(),
    ).limit(limit).offset(offset)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{slug}", response_model=BlogPostSchema)
async def get_post_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Получить опубликованную статью по slug"""
    result = await db.execute(
        select(BlogPost).where(
            BlogPost.slug == slug,
            BlogPost.is_published.is_(True),
        )
    )
    post = result.scalar_one_or_none()

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

    existing = await db.execute(select(BlogPost).where(BlogPost.slug == post_data.slug))
    if existing.scalar_one_or_none():
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

    new_post = BlogPost(**payload)
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    return new_post


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

    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья не найдена")

    update_data = post_data.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != post.slug:
        existing = await db.execute(select(BlogPost).where(BlogPost.slug == update_data["slug"]))
        if existing.scalar_one_or_none():
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

    for field, value in update_data.items():
        setattr(post, field, value)

    await db.commit()
    await db.refresh(post)
    return post


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

    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья не найдена")

    await db.delete(post)
    await db.commit()
    return None
