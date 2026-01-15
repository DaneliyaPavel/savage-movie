#!/bin/bash
# Самый простой скрипт - использует только bcrypt напрямую

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Использование: ./scripts/create-admin-direct.sh <email> <password>"
    exit 1
fi

EMAIL=$1
PASSWORD=$2

echo "🔐 Создание администратора..."

DB_CONTAINER="savage_movie_db_dev"
if ! docker ps | grep -q $DB_CONTAINER; then
    DB_CONTAINER="savage_movie_db"
fi

BACKEND_CONTAINER="savage_movie_backend_dev"
if ! docker ps | grep -q $BACKEND_CONTAINER; then
    BACKEND_CONTAINER="savage_movie_backend"
fi

# Генерируем хеш через bcrypt напрямую
echo "Генерация хеша пароля..."
HASH=$(docker exec $BACKEND_CONTAINER python3 -c "
import bcrypt
p = '$PASSWORD'.encode('utf-8')
if len(p) > 72:
    p = p[:72]
print(bcrypt.hashpw(p, bcrypt.gensalt()).decode('utf-8'))
" 2>&1)

if [ -z "$HASH" ] || echo "$HASH" | grep -q "Error\|Traceback"; then
    echo "❌ Ошибка: $HASH"
    exit 1
fi

echo "✅ Хеш создан"

# Создаем пользователя
echo "Создание пользователя..."
docker exec -i $DB_CONTAINER psql -U postgres -d savage_movie << EOF
INSERT INTO users (email, password_hash, full_name, role, provider)
VALUES ('$EMAIL', '$HASH', 'Administrator', 'admin', 'email')
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, role = 'admin';
EOF

echo ""
echo "✅ Готово! Email: $EMAIL, Пароль: $PASSWORD"
echo "Войдите на http://localhost:3000/login"
echo ""
