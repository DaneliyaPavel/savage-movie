"""
API роуты для курсов
"""
from fastapi import APIRouter, Depends, HTTPException, Response, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.courses import SqlAlchemyCoursesRepository
from app.infrastructure.db.repositories.enrollments import SqlAlchemyEnrollmentsRepository
from app.interfaces.schemas.course import (
    Course as CourseSchema,
    CourseContent,
    CourseCreate,
    CourseUpdate,
    PublicCourse,
)
from app.interfaces.schemas.reorder import ReorderRequest
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["courses"])


async def can_access_course_content(user: User, course_id: UUID, db: AsyncSession) -> bool:
    """Платный контент курса (ссылки на видео, материалы) видят админ и записанный студент"""
    if user.role == "admin":
        return True
    repo = SqlAlchemyEnrollmentsRepository(db)
    enrollment = await repo.get_by_user_and_course(user.id, course_id)
    return enrollment is not None


# Публичные GET отдают PublicCourse: response_model отсекает video_url и instructor_id
# для всех, включая админа. Полные данные — только через GET /{course_id}/content ниже,
# который закрыт авторизацией (fail-closed). Опциональную авторизацию на публичных GET
# намеренно не делаем: клиент без токена (например, редактор админки до загрузки токена)
# молча получил бы пустые video_url, а следующее сохранение курса затёрло бы их в БД.
@router.get("", response_model=List[PublicCourse])
async def get_courses(
    category: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Получить список курсов"""
    repo = SqlAlchemyCoursesRepository(db)
    return await repo.list_courses(category, limit, offset)


def _is_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except (ValueError, TypeError):
        return False


@router.get("/{id_or_slug}", response_model=PublicCourse)
async def get_course(id_or_slug: str, db: AsyncSession = Depends(get_db)):
    """Получить курс по id (UUID) или slug с модулями и уроками (без ссылок на видео)"""
    repo = SqlAlchemyCoursesRepository(db)
    if _is_uuid(id_or_slug):
        course = await repo.get_by_id_with_relations(UUID(id_or_slug))
    else:
        course = await repo.get_by_slug(id_or_slug)

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )

    return course


@router.get("/{course_id}/content", response_model=CourseContent)
async def get_course_content(
    course_id: UUID,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Полный курс с video_url (доступно записанным студентам и админам)"""
    # NOTE (ops): этот гейт закрывает только API. Сами видео защищает Bunny: платные уроки
    # должны лежать в отдельной библиотеке с Token Authentication (см. schemas/course.py).
    if not await can_access_course_content(current_user, course_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к урокам курса",
        )

    repo = SqlAlchemyCoursesRepository(db)
    course = await repo.get_by_id_with_relations(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )

    # Ответ зависит от пользователя: промежуточные кеши хранить его не должны
    response.headers["Cache-Control"] = "private, no-store"
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить курс (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут удалять курсы"
        )
    repo = SqlAlchemyCoursesRepository(db)
    deleted = await repo.delete(course_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )


@router.post("", response_model=CourseSchema, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать курс (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут создавать курсы"
        )
    
    repo = SqlAlchemyCoursesRepository(db)
    existing = await repo.get_by_slug(course_data.slug)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Курс с таким slug уже существует"
        )
    
    # Создаем курс
    course_dict = course_data.model_dump(exclude={"modules"})
    if not course_dict.get("instructor_id"):
        course_dict["instructor_id"] = current_user.id
    
    modules_data = []
    if course_data.modules:
        for module_data in course_data.modules:
            module_payload = module_data.model_dump(exclude={"lessons"})
            lessons_payload = []
            if module_data.lessons:
                lessons_payload = [lesson.model_dump() for lesson in module_data.lessons]
            module_payload["lessons"] = lessons_payload
            modules_data.append(module_payload)

    return await repo.create(course_dict, modules_data or None)


@router.put("/{course_id}", response_model=CourseSchema)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить курс (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут обновлять курсы"
        )
    
    repo = SqlAlchemyCoursesRepository(db)
    update_data = course_data.model_dump(exclude_unset=True)
    # Если обновляются модули — грузим курс с relations, иначе ленивая загрузка course.modules вызовет MissingGreenlet в async
    if "modules" in update_data:
        course = await repo.get_by_id_with_relations(course_id)
    else:
        course = await repo.get_by_id(course_id)

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )

    return await repo.update(course, update_data)


@router.post("/reorder", status_code=status.HTTP_200_OK)
async def reorder_courses(
    body: ReorderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновить порядок курсов (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут изменять порядок курсов"
        )
    
    repo = SqlAlchemyCoursesRepository(db)
    await repo.reorder([{"id": str(u.id), "display_order": u.display_order} for u in body.updates])
    return {"message": "Порядок курсов обновлен"}
