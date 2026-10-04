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
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    DB_CONTAINER="savage_movie_db"
fi
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Контейнер базы данных не найден"
    exit 1
fi

# Определяем имя контейнера Backend
BACKEND_CONTAINER="savage_movie_backend_dev"
if ! docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
    BACKEND_CONTAINER="savage_movie_backend"
fi
if ! docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
    echo "❌ Контейнер backend не найден"
    exit 1
fi

# Публичная регистрация не подтверждает email: адрес будущего админа мог заранее занять
# посторонний. Выданные ему токены привязаны к id аккаунта (stateless JWT, backend берёт роль
# из БД на каждый запрос, а refresh их продлевает), поэтому после повышения аккаунта «на месте»
# они стали бы токенами админа. Обычный аккаунт на месте не повышаем: без
# CONFIRM_REPLACE_ACCOUNT=1 останавливаемся, с ним заменяем строку целиком (новый id, старые
# токены перестают действовать). Так же ведёт себя seed_admin_user в backend/app/main.py.
EXISTING=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d savage_movie -tA \
  -v ON_ERROR_STOP=1 -v EMAIL="$EMAIL" << 'EOF'
SELECT u.role,
       (SELECT count(*) FROM enrollments e WHERE e.user_id = u.id),
       (SELECT count(*) FROM payments p WHERE p.user_id = u.id)
FROM users u
WHERE u.email = :'EMAIL';
EOF
) || { echo "❌ Не удалось проверить, есть ли уже аккаунт с таким email"; exit 1; }
IFS='|' read -r EXISTING_ROLE EXISTING_ENROLLMENTS EXISTING_PAYMENTS <<< "$EXISTING"

REPLACE_ACCOUNT=0
if [ -n "$EXISTING_ROLE" ] && [ "$EXISTING_ROLE" != "admin" ]; then
    echo ""
    echo "⚠️  $EMAIL уже зарегистрирован как обычный аккаунт (роль: $EXISTING_ROLE)."
    echo "   Аккаунт мог создать не владелец адреса, а его уже выданные токены после повышения"
    echo "   роли стали бы токенами администратора. Поэтому скрипт его не повышает."
    if [ "${CONFIRM_REPLACE_ACCOUNT:-}" != "1" ]; then
        echo "   Если адрес ваш и аккаунт можно заменить, запустите ещё раз:"
        echo "   CONFIRM_REPLACE_ACCOUNT=1 ./scripts/create-admin-simple.sh <email> <password>"
        echo "   Аккаунт будет удалён и создан заново как администратор: пароль и вход через"
        echo "   Google/Яндекс сбросятся, выданные токены перестанут действовать, записи на курсы"
        echo "   ($EXISTING_ENROLLMENTS) и платежи ($EXISTING_PAYMENTS) этого аккаунта удалятся,"
        echo "   бронирования и курсы потеряют привязку к нему."
        echo ""
        echo "❌ Администратор не создан, в базе ничего не изменено."
        exit 1
    fi
    echo "   CONFIRM_REPLACE_ACCOUNT=1: аккаунт удаляется и создаётся заново (новый id)."
    echo "   Удаляются записи на курсы ($EXISTING_ENROLLMENTS) и платежи ($EXISTING_PAYMENTS)."
    echo ""
    REPLACE_ACCOUNT=1
fi

# Генерируем хеш пароля через bcrypt напрямую (самый надежный способ)
echo "Генерация хеша пароля через bcrypt..."
HASH=$(printf '%s' "$PASSWORD" | docker exec -i "$BACKEND_CONTAINER" python3 -c "
import sys
import bcrypt
password = sys.stdin.read().encode('utf-8')
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
RESULT=$(docker exec -i "$DB_CONTAINER" psql -U postgres -d savage_movie -qtA \
  -v ON_ERROR_STOP=1 -v EMAIL="$EMAIL" -v HASH="$HASH" -v REPLACE_ACCOUNT="$REPLACE_ACCOUNT" << 'EOF'
BEGIN;
-- Обычный аккаунт заменяем целиком (новый id): выданные ему токены привязаны к старому id
-- и перестают действовать. Удаляем только с CONFIRM_REPLACE_ACCOUNT=1 (см. проверку выше).
DELETE FROM users
WHERE email = :'EMAIL' AND role <> 'admin' AND :'REPLACE_ACCOUNT' = '1';
INSERT INTO users (email, password_hash, full_name, role, provider)
VALUES (:'EMAIL', :'HASH', 'Administrator', 'admin', 'email')
ON CONFLICT (email) DO UPDATE
-- у действующего админа меняется только пароль, привязку к Google/Яндекс не трогаем
SET password_hash = EXCLUDED.password_hash
-- обычный аккаунт, появившийся после проверки выше, на месте не повышаем
WHERE users.role = 'admin'
RETURNING id;
COMMIT;
EOF
) || { echo "❌ Не удалось записать администратора в базу, изменения отменены"; exit 1; }

if [ -z "$RESULT" ]; then
    echo "❌ Администратор не создан: $EMAIL занят обычным аккаунтом, появившимся только что."
    echo "   Запустите скрипт ещё раз и прочитайте сообщение про обычный аккаунт."
    exit 1
fi

echo ""
echo "✅ Администратор создан!"
echo "   Email: $EMAIL"
echo "   Пароль: (как указано при запуске)"
echo ""
echo "Теперь вы можете войти в админ-панель:"
echo "   http://localhost:3000/login"
echo "   После входа вы будете перенаправлены на http://localhost:3000/admin"
echo ""
