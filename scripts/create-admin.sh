#!/bin/bash
# Скрипт для создания администратора

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Использование: ./scripts/create-admin.sh <email> <password>"
    echo "Пример: ./scripts/create-admin.sh admin@example.com mypassword123"
    exit 1
fi

EMAIL=$1
PASSWORD=$2

echo "🔐 Создание администратора..."

# Определяем имя контейнера БД
DB_CONTAINER="savage_movie_db_dev"
if ! docker ps | grep -q $DB_CONTAINER; then
    DB_CONTAINER="savage_movie_db"
fi

# Определяем имя контейнера Backend
BACKEND_CONTAINER="savage_movie_backend_dev"
if ! docker ps | grep -q $BACKEND_CONTAINER; then
    BACKEND_CONTAINER="savage_movie_backend"
fi

# Используем API для регистрации, затем обновим роль
echo "Регистрация пользователя через API..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"full_name\": \"Administrator\",
    \"provider\": \"email\"
  }" 2>&1)

# Проверяем результат регистрации
USE_API_HASH=false
if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
  echo "✅ Пользователь успешно создан через API"
  USE_API_HASH=true
elif echo "$REGISTER_RESPONSE" | grep -q "уже существует"; then
  echo "ℹ️  Пользователь уже существует"
  USE_API_HASH=true
else
  echo "⚠️  Не удалось зарегистрировать через API, используем прямой способ..."
  echo "   Ответ API: $REGISTER_RESPONSE"
  
  # Альтернативный способ: используем Python скрипт напрямую
  echo "Генерация хеша пароля через Python..."
  HASH=$(docker exec $BACKEND_CONTAINER sh -c "cd /app/backend && python3 << 'PYEOF'
import sys
import os
sys.path.insert(0, '/app/backend')
os.environ['PYTHONPATH'] = '/app/backend'

try:
    # Используем функцию из app.utils.security напрямую
    from app.utils.security import hash_password
    password = '$PASSWORD'
    # Ограничиваем длину пароля для bcrypt (максимум 72 байта)
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    hash_result = hash_password(password)
    print(hash_result)
except Exception as e:
    print(f'ERROR: {str(e)}', file=sys.stderr)
    sys.exit(1)
PYEOF
" 2>&1)
  
  if echo "$HASH" | grep -q "ERROR" || [ -z "$HASH" ]; then
    echo "❌ Ошибка генерации хеша: $HASH"
    echo "Пробуем альтернативный способ через bcrypt напрямую..."
    # Используем простой bcrypt без passlib
    HASH=$(docker exec $BACKEND_CONTAINER sh -c "cd /app/backend && python3 -c \"
import bcrypt
password = '$PASSWORD'.encode('utf-8')
if len(password) > 72:
    password = password[:72]
salt = bcrypt.gensalt()
print(bcrypt.hashpw(password, salt).decode('utf-8'))
\"")
  fi
  
  if [ -z "$HASH" ] || echo "$HASH" | grep -q "ERROR"; then
    echo "❌ Не удалось сгенерировать хеш пароля"
    exit 1
  fi
  
  echo "✅ Хеш пароля успешно сгенерирован"
fi

# Обновляем роль пользователя на admin в БД
echo "Обновление роли пользователя на admin..."
if [ "$USE_API_HASH" = true ]; then
  # Если пользователь был создан через API, просто обновляем роль
  docker exec -i $DB_CONTAINER psql -U postgres -d savage_movie << EOF
UPDATE users 
SET role = 'admin' 
WHERE email = '$EMAIL';
EOF
else
  # Если есть хеш, создаем/обновляем пользователя напрямую
  docker exec -i $DB_CONTAINER psql -U postgres -d savage_movie << EOF
INSERT INTO users (email, password_hash, full_name, role, provider)
VALUES ('$EMAIL', '$HASH', 'Administrator', 'admin', 'email')
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, role = 'admin';
EOF
fi

echo ""
echo "✅ Администратор создан!"
echo "   Email: $EMAIL"
echo "   Пароль: $PASSWORD"
echo ""
echo "Теперь вы можете войти в админ-панель:"
echo "   http://localhost:3000/admin"
echo ""
