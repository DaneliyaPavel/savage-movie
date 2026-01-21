"""
API роуты для курсов
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID

from app.database import get_db
from app.models.course import Course, CourseModule, Lesson
from app.models.user import User
from app.schemas.course import Course as CourseSchema, CourseCreate, CourseUpdate
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=List[CourseSchema])
async def get_courses(
    category: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Получить список курсов"""
    query = select(Course).options(
        selectinload(Course.modules).selectinload(CourseModule.lessons)
    )
    
    if category and category != "all":
        query = query.where(Course.category == category)
    
    # Сортируем по display_order (если есть), затем по created_at
    # NULL значения идут первыми (0), затем по возрастанию display_order
    query = query.order_by(
        func.coalesce(Course.display_order, 0).asc(),
        Course.created_at.desc()
    ).limit(limit).offset(offset)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return courses


@router.get("/{slug}", response_model=CourseSchema)
async def get_course_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Получить курс по slug с модулями и уроками"""
    result = await db.execute(
        select(Course)
        .where(Course.slug == slug)
        .options(
            selectinload(Course.modules).selectinload(CourseModule.lessons)
        )
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    
    # Сортируем модули и уроки по order
    course.modules.sort(key=lambda m: m.order)
    for module in course.modules:
        module.lessons.sort(key=lambda l: l.order)
    
    return course


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
    
    # Проверяем, существует ли курс с таким slug
    result = await db.execute(select(Course).where(Course.slug == course_data.slug))
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Курс с таким slug уже существует"
        )
    
    # Создаем курс
    course_dict = course_data.model_dump(exclude={"modules"})
    if not course_dict.get("instructor_id"):
        course_dict["instructor_id"] = current_user.id
    
    new_course = Course(**course_dict)
    db.add(new_course)
    await db.flush()  # Получаем ID курса
    
    # Создаем модули и уроки
    if course_data.modules:
        for module_data in course_data.modules:
            module_dict = module_data.model_dump(exclude={"lessons"})
            module_dict["course_id"] = new_course.id
            new_module = CourseModule(**module_dict)
            db.add(new_module)
            await db.flush()
            
            # Создаем уроки
            if module_data.lessons:
                for lesson_data in module_data.lessons:
                    lesson_dict = lesson_data.model_dump()
                    lesson_dict["module_id"] = new_module.id
                    new_lesson = Lesson(**lesson_dict)
                    db.add(new_lesson)
    
    await db.commit()
    await db.refresh(new_course)
    
    # Загружаем с модулями и уроками
    result = await db.execute(
        select(Course)
        .where(Course.id == new_course.id)
        .options(
            selectinload(Course.modules).selectinload(CourseModule.lessons)
        )
    )
    course = result.scalar_one()
    
    return course


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
    
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    
    # Обновляем поля
    update_data = course_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    await db.commit()
    await db.refresh(course)
    
    # Загружаем с модулями и уроками
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(
            selectinload(Course.modules).selectinload(CourseModule.lessons)
        )
    )
    updated_course = result.scalar_one()
    
    return updated_course


@router.post("/reorder", status_code=status.HTTP_200_OK)
async def reorder_courses(
    updates: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить порядок курсов (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут изменять порядок курсов"
        )
    
    updates_list = updates.get("updates", [])
    
    for update in updates_list:
        course_id = UUID(update["id"])
        display_order = update["display_order"]
        
        result = await db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        
        if course:
            course.display_order = display_order
    
    await db.commit()
    
    return {"message": "Порядок курсов обновлен"}
