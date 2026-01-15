# Настройка завершена! ✅

## Выполненные шаги:

### ✅ 1. PostgreSQL база данных
- База данных `savage_movie` создана
- Миграции выполнены (таблицы созданы)
- **Примечание**: Используется пользователь `daneliyapavel` вместо `postgres` (настроено в `backend/.env`)

### ✅ 2. Переменные окружения
- `backend/.env` создан (требует заполнения OAuth credentials)
- `.env.local` создан (требует заполнения API keys)

### ✅ 3. Миграции БД
- SQL скрипт `backend/scripts/init_db.sql` выполнен
- Все таблицы созданы в базе данных

### ✅ 4. Python зависимости
- Виртуальное окружение создано: `backend/venv/`
- Зависимости установлены из `requirements.txt`
- **Примечание**: Использована версия pydantic 2.9.2 для совместимости

### ✅ 5. Python API сервер
Готов к запуску. 

**Вариант 1: Используя скрипт:**
```bash
./START_SERVER.sh
```

**Вариант 2: Вручную:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### ⚠️ 6. OAuth провайдеры (требуют настройки)

#### Google OAuth:
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID
5. Добавьте authorized redirect URI: `http://localhost:8000/api/auth/oauth/google/callback`
6. Скопируйте Client ID и Client Secret в `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=ваш_client_id
   GOOGLE_CLIENT_SECRET=ваш_client_secret
   ```
7. Также добавьте в `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=ваш_client_id
   ```

#### Yandex OAuth:
1. Перейдите в [Yandex OAuth](https://oauth.yandex.ru/)
2. Создайте новое приложение
3. Добавьте redirect URI: `http://localhost:8000/api/auth/oauth/yandex/callback`
4. Скопируйте Client ID и Client Secret в `backend/.env`:
   ```
   YANDEX_CLIENT_ID=ваш_client_id
   YANDEX_CLIENT_SECRET=ваш_client_secret
   ```
5. Также добавьте в `.env.local`:
   ```
   NEXT_PUBLIC_YANDEX_CLIENT_ID=ваш_client_id
   ```

## Следующие шаги:

### 1. Запустите Python API сервер:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступен на: http://localhost:8000
Документация: http://localhost:8000/docs

### 2. Запустите Next.js frontend:
```bash
npm run dev
```

Frontend будет доступен на: http://localhost:3000

### 3. Настройте остальные сервисы (опционально):
- **ЮKassa** - для платежей
- **Mux** - для видео
- **Resend** - для email
- **Calendly** - для бронирования

Добавьте соответствующие ключи в `.env.local` и `backend/.env`

## Проверка работы:

1. Откройте http://localhost:8000/docs - должна открыться Swagger документация API
2. Откройте http://localhost:3000 - должна открыться главная страница
3. Попробуйте зарегистрироваться: http://localhost:3000/register
4. Попробуйте войти: http://localhost:3000/login

## Важно:

- **JWT_SECRET** в `backend/.env` должен быть изменен на случайную строку в production!
- Все OAuth credentials должны быть настроены для работы OAuth входа
- Для production обновите `APP_URL` и redirect URIs в OAuth настройках
