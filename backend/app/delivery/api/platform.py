"""
Mock API образовательной платформы для тестирования.
При успешной оплате webhook может вызывать внешний URL; если не задан PLATFORM_API_URL,
используется логирование. Этот роут позволяет тестировать интеграцию,
указав PLATFORM_API_URL на свой backend (например http://localhost:8000/api/internal/platform).
"""

import logging
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from typing import Any, Dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/internal/platform", tags=["platform-mock"])


@router.post("/enroll")
async def mock_platform_enroll(payload: Dict[str, Any]) -> JSONResponse:
    """
    Заглушка API платформы: принимает данные о записи на курс (user_id, course_id, ...),
    логирует и возвращает 200. Для тестовых данных.
    """
    logger.info("Platform enroll (mock): %s", payload)
    return JSONResponse({"received": True, "status": "enrolled"}, status_code=200)
