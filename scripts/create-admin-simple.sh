#!/bin/bash
# Упрощенный скрипт для создания администратора

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Использование: ./scripts/create-admin-simple.sh <email> <password>"
    echo "Пример: ./scripts/create-admin-simple.sh admin@example.com mypassword123"
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

# Генерируем хеш пароля через bcrypt напрямую (самый надежный способ)
echo "Генерация хеша пароля через bcrypt..."
HASH=$(docker exec $BACKEND_CONTAINER python3 -c "
import bcrypt
password = '$PASSWORD'.encode('utf-8')
if len(password) > 72:
    password = password[:72]
salt = bcrypt.gensalt()
print(bcrypt.hashpw(password, salt).decode('utf-8'))
" 2>&1)

if [ -z "$HASH" ] || echo "$HASH" | grep -q "Error\|Traceback\|Exception"; then
    echo "❌ Ошибка генерации хеша: $HASH"
    exit 1
fi

echo "✅ Хеш пароля успешно сгенерирован"

# Создаем/обновляем пользователя в БД
echo "Создание пользователя в базе данных..."
docker exec -i $DB_CONTAINER psql -U postgres -d savage_movie << EOF
INSERT INTO users (email, password_hash, full_name, role, provider)
VALUES ('$EMAIL', '$HASH', 'Administrator', 'admin', 'email')
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, role = 'admin';
EOF

echo ""
echo "✅ Администратор создан!"
echo "   Email: $EMAIL"
echo "   Пароль: $PASSWORD"
echo ""
echo "Теперь вы можете войти в админ-панель:"
echo "   http://localhost:3000/login"
echo "   После входа вы будете перенаправлены на http://localhost:3000/admin"
echo ""
