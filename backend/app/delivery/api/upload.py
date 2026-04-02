"""
API роуты для загрузки файлов
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from fastapi.responses import JSONResponse
from pathlib import Path
import uuid
from typing import List

from app.delivery.api.auth import get_current_user
from app.infrastructure.db.models.user import User
from app.rate_limit import limiter

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Настройки
# Определяем путь к uploads автоматически
# В Docker: /app/backend/uploads (монтируется как volume)
# Локально: uploads относительно корня backend
import os
UPLOAD_BASE = os.getenv("UPLOAD_DIR")
if UPLOAD_BASE:
    UPLOAD_DIR = Path(UPLOAD_BASE)
else:
    # Автоматическое определение: если мы в Docker (/app), используем /app/backend/uploads
    # Иначе используем uploads относительно текущего файла
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR = BASE_DIR / "uploads"
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"]

# Создаем директорию для загрузок если её нет
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "images").mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "videos").mkdir(parents=True, exist_ok=True)


def get_file_extension(content_type: str) -> str:
    """Получить расширение файла из content-type"""
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/x-msvideo": ".avi",
    }
    return mapping.get(content_type, "")


# Magic bytes для валидации реального типа файла (защита от MIME spoofing)
_MAGIC_SIGNATURES: dict[str, list[bytes]] = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"],  # RIFF....WEBP
    "video/mp4": [b"\x00\x00\x00\x18ftyp", b"\x00\x00\x00\x1cftyp", b"\x00\x00\x00\x20ftyp", b"ftyp"],
    "video/quicktime": [b"\x00\x00\x00\x14ftypqt"],
    "video/x-msvideo": [b"RIFF"],  # RIFF....AVI
}


def _validate_magic_bytes(contents: bytes, declared_type: str) -> bool:
    """Проверяет magic bytes файла против заявленного content-type."""
    signatures = _MAGIC_SIGNATURES.get(declared_type)
    if not signatures:
        return False
    return any(contents[:len(sig)] == sig for sig in signatures)


@router.post("/image")
@limiter.limit("10/minute")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Загрузить изображение (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут загружать файлы"
        )
    
    # Проверка типа файла
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Читаем файл для проверки размера
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимальный размер: {MAX_IMAGE_SIZE / 1024 / 1024}MB",
        )

    # Проверяем magic bytes (защита от MIME spoofing)
    if not _validate_magic_bytes(contents, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Содержимое файла не соответствует заявленному типу",
        )

    # Генерируем уникальное имя файла
    file_extension = get_file_extension(file.content_type)
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / "images" / file_name

    # Сохраняем файл
    with open(file_path, "wb") as f:
        f.write(contents)

    # Возвращаем URL файла (относительный путь для Next.js API route)
    file_url = f"/uploads/images/{file_name}"

    return JSONResponse({
        "url": file_url,
        "filename": file_name,
        "size": len(contents),
        "content_type": file.content_type,
    })


@router.post("/video")
@limiter.limit("10/minute")
async def upload_video(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Загрузить видео (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут загружать файлы"
        )
    
    # Проверка типа файла
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(ALLOWED_VIDEO_TYPES)}"
        )
    
    # Читаем файл для проверки размера
    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимальный размер: {MAX_VIDEO_SIZE / 1024 / 1024}MB",
        )

    # Проверяем magic bytes (защита от MIME spoofing)
    if not _validate_magic_bytes(contents, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Содержимое файла не соответствует заявленному типу",
        )

    # Генерируем уникальное имя файла
    file_extension = get_file_extension(file.content_type)
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / "videos" / file_name

    # Сохраняем файл
    with open(file_path, "wb") as f:
        f.write(contents)

    # Возвращаем URL файла (относительный путь для Next.js API route)
    file_url = f"/uploads/videos/{file_name}"

    return JSONResponse({
        "url": file_url,
        "filename": file_name,
        "size": len(contents),
        "content_type": file.content_type,
    })


@router.post("/images")
@limiter.limit("10/minute")
async def upload_images(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    """Загрузить несколько изображений (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут загружать файлы"
        )
    
    uploaded_files = []
    
    for file in files:
        # Проверка типа файла
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            continue  # Пропускаем неподдерживаемые файлы

        # Читаем файл
        contents = await file.read()
        if len(contents) > MAX_IMAGE_SIZE:
            continue  # Пропускаем слишком большие файлы

        # Проверяем magic bytes
        if not _validate_magic_bytes(contents, file.content_type):
            continue
        
        # Генерируем уникальное имя файла
        file_extension = get_file_extension(file.content_type)
        file_name = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / "images" / file_name
        
        # Сохраняем файл
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_url = f"/uploads/images/{file_name}"
        uploaded_files.append({
            "url": file_url,
            "filename": file_name,
            "size": len(contents),
            "content_type": file.content_type
        })
    
    return JSONResponse({"files": uploaded_files})
