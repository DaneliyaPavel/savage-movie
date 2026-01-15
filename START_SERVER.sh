#!/bin/bash
# Скрипт для запуска Python API сервера

cd "$(dirname "$0")/backend"
source venv/bin/activate

echo "🚀 Запуск Python API сервера..."
echo "📡 API будет доступен на: http://localhost:8000"
echo "📚 Документация: http://localhost:8000/docs"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
