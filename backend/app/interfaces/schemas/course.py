"""
Pydantic схемы для курсов
"""
from pydantic import BaseModel, Field, field_validator
from typing import Annotated, Optional, List, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class CardCoverSettings(BaseModel):
    """Настройки обложки карточки курса (mesh, grid, scanlines, orbs, etc.)"""
    preset: Optional[str] = None  # mesh, meshGrid, meshGridScanlines, minimalTech
    accent1: Optional[str] = None
    accent2: Optional[str] = None
    accent3: Optional[str] = None
    show_grid: Optional[bool] = None
    show_noise: Optional[bool] = None
    show_scanlines: Optional[bool] = None
    show_orbs: Optional[bool] = None
    show_frame_corners: Optional[bool] = None
    show_play_icon: Optional[bool] = None
    overlay_strength: Optional[str] = None  # low, medium, high

    class Config:
        extra = 'ignore'


class LessonBase(BaseModel):
    title: str
    video_url: Optional[str] = None
    duration: Optional[int] = None
    order: int


class LessonCreate(LessonBase):
    pass


class Lesson(LessonBase):
    id: UUID
    module_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CourseModuleBase(BaseModel):
    title: str
    order: int


class CourseModuleCreate(CourseModuleBase):
    lessons: Optional[List[LessonCreate]] = []


class CourseModule(CourseModuleBase):
    id: UUID
    course_id: UUID
    lessons: List[Lesson] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    price: Decimal
    duration: Optional[int] = None
    cover_image: Optional[str] = None
    video_promo_url: Optional[str] = None
    category: str
    requirements: Optional[List[str]] = None
    what_you_learn: Optional[List[str]] = None
    level: Optional[str] = None  # 'beginner', 'intermediate', 'advanced'
    certificate: Optional[str] = None  # 'yes', 'no'
    format: Optional[str] = None  # 'online', 'offline', 'hybrid', 'online+live'
    display_order: Optional[int] = None
    short_description: Optional[str] = None
    duration_text: Optional[str] = None
    location_text: Optional[str] = None
    schedule_text: Optional[str] = None
    tags: Optional[List[str]] = None
    badge_text: Optional[str] = None
    cta_text: Optional[str] = None
    card_cover: Optional[dict[str, Any]] = None  # CardCoverSettings as dict from JSONB


# Цена на ВХОДЕ (create/update). Колонка courses.price — Numeric(10, 2) NOT NULL:
# - больше 8 цифр до запятой — переполнение в БД, то есть 500 вместо понятного 422;
# - доли копейки Postgres молча округлит (0.004 -> 0.00), и такой курс окажется «бесплатным»
#   для проверки price == 0 при самозаписи (enrollments.py);
# - отрицательная цена ломает сумму платежа. NaN/Infinity отсекаем отдельно.
# Ответы (CourseBase.price) не ограничиваем, чтобы не падать на уже сохранённых строках.
CoursePrice = Annotated[
    Decimal, Field(ge=0, max_digits=10, decimal_places=2, allow_inf_nan=False)
]


class CourseCreate(CourseBase):
    price: CoursePrice
    instructor_id: Optional[UUID] = None
    modules: Optional[List[CourseModuleCreate]] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[CoursePrice] = None
    duration: Optional[int] = None
    cover_image: Optional[str] = None
    video_promo_url: Optional[str] = None
    category: Optional[str] = None
    requirements: Optional[List[str]] = None
    what_you_learn: Optional[List[str]] = None
    level: Optional[str] = None
    certificate: Optional[str] = None
    format: Optional[str] = None
    display_order: Optional[int] = None
    short_description: Optional[str] = None
    duration_text: Optional[str] = None
    location_text: Optional[str] = None
    schedule_text: Optional[str] = None
    tags: Optional[List[str]] = None
    badge_text: Optional[str] = None
    cta_text: Optional[str] = None
    card_cover: Optional[dict[str, Any]] = None
    instructor_id: Optional[UUID] = None
    modules: Optional[List[CourseModuleCreate]] = None

    @field_validator('price')
    @classmethod
    def price_not_null(cls, value: Optional[Decimal]) -> Optional[Decimal]:
        # Отсутствие поля = «не менять», а явный null упал бы на NOT NULL в БД (500)
        if value is None:
            raise ValueError('price не может быть null')
        return value


class Course(CourseBase):
    id: UUID
    instructor_id: Optional[UUID] = None
    modules: List[CourseModule] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Публичная выдача (GET /api/courses, GET /api/courses/{id_or_slug}) ---
# Состав программы (названия и длительность уроков) — маркетинг, он остаётся открытым.
# Ссылки на видео уроков (video_url) и instructor_id (UUID админа-автора) наружу не отдаём:
# их видят только админ и записанный студент через GET /api/courses/{id}/content.
# ВАЖНО (ops): скрытие поля в API не защищает сами видео. В Bunny Stream видео доступно
# любому, у кого есть GUID, пока в библиотеке не включена Token Authentication. Платные
# уроки должны лежать в ОТДЕЛЬНОЙ библиотеке Bunny с токен-авторизацией (не в основной
# библиотеке сайта, там видео публичны по задумке); подписи ссылок в коде пока нет.


class PublicLesson(BaseModel):
    id: UUID
    module_id: UUID
    title: str
    duration: Optional[int] = None
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class PublicCourseModule(CourseModuleBase):
    id: UUID
    course_id: UUID
    lessons: List[PublicLesson] = []
    created_at: datetime

    class Config:
        from_attributes = True


class PublicCourse(CourseBase):
    id: UUID
    modules: List[PublicCourseModule] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CourseContent(CourseBase):
    """Полный курс с video_url для админа и записанных студентов (без instructor_id)"""
    id: UUID
    modules: List[CourseModule] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
