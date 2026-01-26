"""
SQLAlchemy repository for Course.
"""
from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.db.models.course import Course, CourseModule, Lesson


class SqlAlchemyCoursesRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_courses(
        self,
        category: Optional[str],
        limit: int,
        offset: int,
    ) -> List[Course]:
        query = select(Course).options(
            selectinload(Course.modules).selectinload(CourseModule.lessons)
        )

        if category and category != "all":
            query = query.where(Course.category == category)

        query = query.order_by(
            func.coalesce(Course.display_order, 0).asc(),
            Course.created_at.desc(),
        ).limit(limit).offset(offset)

        result = await self._session.execute(query)
        return result.scalars().all()

    async def get_by_slug(self, slug: str) -> Optional[Course]:
        query = (
            select(Course)
            .where(Course.slug == slug)
            .options(selectinload(Course.modules).selectinload(CourseModule.lessons))
        )
        result = await self._session.execute(query)
        course = result.scalar_one_or_none()
        self._sort_modules(course)
        return course

    async def get_by_id(self, course_id: UUID) -> Optional[Course]:
        result = await self._session.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()

    async def get_by_id_with_relations(self, course_id: UUID) -> Optional[Course]:
        query = (
            select(Course)
            .where(Course.id == course_id)
            .options(selectinload(Course.modules).selectinload(CourseModule.lessons))
        )
        result = await self._session.execute(query)
        course = result.scalar_one_or_none()
        self._sort_modules(course)
        return course

    async def create(self, course_data: dict, modules_data: Optional[List[dict]]) -> Course:
        new_course = Course(**course_data)
        self._session.add(new_course)
        await self._session.flush()

        if modules_data:
            for module_data in modules_data:
                module_payload = dict(module_data)
                lessons_data = module_payload.pop("lessons", []) or []
                new_module = CourseModule(**module_payload, course_id=new_course.id)
                self._session.add(new_module)
                await self._session.flush()

                for lesson_data in lessons_data:
                    new_lesson = Lesson(**lesson_data, module_id=new_module.id)
                    self._session.add(new_lesson)

        await self._session.commit()
        course = await self.get_by_id_with_relations(new_course.id)
        if course is None:
            raise RuntimeError("Failed to load created course")
        return course

    async def update(self, course: Course, data: dict) -> Course:
        for field, value in data.items():
            setattr(course, field, value)
        await self._session.commit()
        updated = await self.get_by_id_with_relations(course.id)
        if updated is None:
            raise RuntimeError("Failed to load updated course")
        return updated

    async def reorder(self, updates: list[dict]) -> None:
        for update in updates:
            course_id = UUID(update["id"])
            display_order = update["display_order"]

            course = await self.get_by_id(course_id)
            if course:
                course.display_order = display_order

        await self._session.commit()

    @staticmethod
    def _sort_modules(course: Optional[Course]) -> None:
        if not course or not course.modules:
            return
        course.modules.sort(key=lambda m: m.order)
        for module in course.modules:
            module.lessons.sort(key=lambda l: l.order)
