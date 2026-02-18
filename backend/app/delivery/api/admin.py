"""
API роуты для админки (пользователи, аналитика)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.models.enrollment import Enrollment
from app.infrastructure.db.models.course import Course
from app.infrastructure.db.models.payment import Payment
from app.infrastructure.db.repositories.users import SqlAlchemyUsersRepository
from app.infrastructure.db.repositories.enrollments import SqlAlchemyEnrollmentsRepository
from app.interfaces.schemas.user import UserResponse
from app.interfaces.schemas.enrollment import EnrollmentWithCourse, CourseSummary
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user: User) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы",
        )
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список пользователей (только админ)"""
    require_admin(current_user)
    repo = SqlAlchemyUsersRepository(db)
    return await repo.list_all(limit=limit, offset=offset)


@router.get("/users/{user_id}/enrollments", response_model=List[EnrollmentWithCourse])
async def list_user_enrollments(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Записи пользователя на курсы (только админ)"""
    require_admin(current_user)
    repo = SqlAlchemyEnrollmentsRepository(db)
    rows = await repo.list_by_user(user_id)
    return [
        EnrollmentWithCourse(
            id=e.id,
            user_id=e.user_id,
            course_id=e.course_id,
            progress=e.progress,
            enrolled_at=e.enrolled_at,
            completed_at=e.completed_at,
            course=CourseSummary.model_validate(e.course),
        )
        for e in rows
    ]


@router.get("/stats/courses")
async def stats_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Аналитика по курсам: количество записей и выручка (только админ)"""
    require_admin(current_user)
    enrollments_q = (
        select(Enrollment.course_id, func.count(Enrollment.id).label("enrollments_count"))
        .group_by(Enrollment.course_id)
    )
    enrollments_result = await db.execute(enrollments_q)
    enrollments_by_course = {row.course_id: row.enrollments_count for row in enrollments_result}

    payments_q = (
        select(Payment.course_id, func.count(Payment.id).label("payments_count"), func.sum(Payment.amount).label("revenue"))
        .where(Payment.status == "succeeded")
        .group_by(Payment.course_id)
    )
    payments_result = await db.execute(payments_q)
    payments_by_course = {
        row.course_id: {"payments_count": row.payments_count, "revenue": float(row.revenue or 0)}
        for row in payments_result
    }

    courses_result = await db.execute(select(Course).order_by(Course.display_order.asc().nulls_last(), Course.created_at.desc()))
    courses = courses_result.scalars().all()
    return [
        {
            "course_id": str(c.id),
            "course_title": c.title,
            "course_slug": c.slug,
            "enrollments_count": enrollments_by_course.get(c.id, 0),
            "payments_count": payments_by_course.get(c.id, {}).get("payments_count", 0),
            "revenue": payments_by_course.get(c.id, {}).get("revenue", 0),
        }
        for c in courses
    ]
