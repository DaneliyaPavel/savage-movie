# SAVAGE MOVIE Backend API

Python FastAPI backend для сайта видеографа и продюсера.

## Технологии

- **FastAPI** - современный веб-фреймворк для Python
- **SQLAlchemy** - ORM для работы с базой данных
- **PostgreSQL** - база данных
- **JWT** - аутентификация через токены
- **OAuth 2.0** - вход через Google и Yandex

## Установка

### 1. Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

Или с использованием виртуального окружения:

```bash
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Настройка базы данных

1. Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE savage_movie;
```

2. Настройте переменные окружения (см. `.env.example`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=savage_movie
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/oauth/google/callback

# OAuth Yandex
YANDEX_CLIENT_ID=your_yandex_client_id
YANDEX_CLIENT_SECRET=your_yandex_client_secret
YANDEX_REDIRECT_URI=http://localhost:8000/api/auth/oauth/yandex/callback

CORS_ORIGINS=http://localhost:3000,http://localhost:3001

RESEND_API_KEY=your_resend_key
ADMIN_EMAIL=savage.movie@yandex.ru

APP_URL=http://localhost:3000
```

### 3. Инициализация базы данных (Alembic)

Для новой базы данных:

```bash
alembic -c alembic.ini upgrade head
```

Если база уже создана старыми SQL-скриптами и соответствует текущей модели:

```bash
alembic -c alembic.ini stamp head
```

### 4. Запуск сервера

Для разработки:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Для production:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Документация

После запуска сервера документация доступна по адресам:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Эндпоинты

### Аутентификация

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Информация о текущем пользователе
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/oauth/google` - URL для OAuth Google
- `GET /api/auth/oauth/google/callback` - Callback от Google
- `GET /api/auth/oauth/yandex` - URL для OAuth Yandex
- `GET /api/auth/oauth/yandex/callback` - Callback от Yandex
- `POST /api/auth/logout` - Выход

### Проекты

- `GET /api/projects` - Список проектов
- `GET /api/projects/{slug}` - Детали проекта
- `POST /api/projects` - Создание проекта (admin only)
- `PUT /api/projects/{id}` - Обновление проекта (admin only)
- `DELETE /api/projects/{id}` - Удаление проекта (admin only)

### Курсы

- `GET /api/courses` - Список курсов
- `GET /api/courses/{slug}` - Детали курса с модулями и уроками
- `POST /api/courses` - Создание курса (admin only)
- `PUT /api/courses/{id}` - Обновление курса (admin only)

### Записи на курсы

- `GET /api/enrollments` - Список записей пользователя
- `GET /api/enrollments/{course_id}` - Проверка записи на курс
- `POST /api/enrollments` - Записаться на курс
- `PUT /api/enrollments/{id}/progress` - Обновить прогресс

### Контактная форма

- `POST /api/contact` - Отправить заявку

### Sitemap

- `GET /api/sitemap/projects` - Список проектов для sitemap
- `GET /api/sitemap/courses` - Список курсов для sitemap

## Настройка OAuth

### Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID
5. Добавьте authorized redirect URI: `http://localhost:8000/api/auth/oauth/google/callback`
6. Скопируйте Client ID и Client Secret в переменные окружения

### Yandex OAuth

1. Перейдите в [Yandex OAuth](https://oauth.yandex.ru/)
2. Создайте новое приложение
3. Добавьте redirect URI: `http://localhost:8000/api/auth/oauth/yandex/callback`
4. Скопируйте Client ID и Client Secret в переменные окружения

## Деплой на VPS

### Подготовка

1. Установите PostgreSQL на сервере
2. Установите Python 3.11+
3. Создайте базу данных и пользователя
4. Скопируйте код на сервер
5. Настройте переменные окружения
6. Запустите миграции БД

### Systemd Service

Создайте файл `/etc/systemd/system/savage-movie-api.service`:

```ini
[Unit]
Description=SAVAGE MOVIE API
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Запустите сервис:

```bash
sudo systemctl enable savage-movie-api
sudo systemctl start savage-movie-api
```

### Nginx Reverse Proxy

Пример конфигурации Nginx:

```nginx
server {
    listen 80;
    server_name api.savagemovie.ru;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Миграции

Используем Alembic. Конфиг: `backend/alembic.ini`.

Создать новую миграцию:

```bash
alembic -c alembic.ini revision --autogenerate -m "Describe change"
```

Применить миграции:

```bash
alembic -c alembic.ini upgrade head
```

## Тестирование

```bash
pytest
```

## Лицензия

Private
