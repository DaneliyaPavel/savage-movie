"""
API роуты для загрузки файлов
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from pathlib import Path
import uuid
from typing import List

from app.delivery.api.auth import get_current_user
from app.infrastructure.db.models.user import User

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


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
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
            detail=f"Файл слишком большой. Максимальный размер: {MAX_IMAGE_SIZE / 1024 / 1024}MB"
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
        "content_type": file.content_type
    })


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
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
            detail=f"Файл слишком большой. Максимальный размер: {MAX_VIDEO_SIZE / 1024 / 1024}MB"
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
        "content_type": file.content_type
    })


@router.post("/images")
async def upload_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
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
