# Настройка переменных окружения

## Frontend (Next.js)

Создайте файл `.env.local` в корне проекта со следующими переменными:

```env
# Python API
NEXT_PUBLIC_API_URL=http://localhost:8000

# OAuth (для frontend redirects)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_YANDEX_CLIENT_ID=your_yandex_client_id

# ЮKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Calendly
NEXT_PUBLIC_CALENDLY_URL=your_calendly_url

# Mux
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
NEXT_PUBLIC_MUX_ENV_KEY=your_mux_env_key

# Resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@savagemovie.ru
ADMIN_EMAIL=savage.movie@yandex.ru

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Backend (Python API)

Создайте файл `backend/.env` на основе `backend/.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=savage_movie
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
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

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Email
RESEND_API_KEY=your_resend_key
ADMIN_EMAIL=savage.movie@yandex.ru

# App URL
APP_URL=http://localhost:3000
```

## Инструкции по получению ключей

### Python API
1. Создайте базу данных PostgreSQL
2. Настройте переменные окружения в `backend/.env`
3. Запустите миграции БД (см. `backend/README.md`)

### OAuth Google
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID
5. Добавьте authorized redirect URI: `http://localhost:8000/api/auth/oauth/google/callback`
6. Скопируйте Client ID и Client Secret

### OAuth Yandex
1. Перейдите в [Yandex OAuth](https://oauth.yandex.ru/)
2. Создайте новое приложение
3. Добавьте redirect URI: `http://localhost:8000/api/auth/oauth/yandex/callback`
4. Скопируйте Client ID и Client Secret

### ЮKassa
1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Создайте магазин
3. Получите Shop ID и Secret Key в настройках магазина

### Calendly
1. Создайте аккаунт на [calendly.com](https://calendly.com)
2. Создайте event types
3. Скопируйте embed URL для встраивания

### Mux
1. Зарегистрируйтесь на [mux.com](https://mux.com)
2. Создайте API token в настройках
3. Скопируйте Token ID и Secret

### Resend
1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Создайте API key
3. Настройте домен для отправки email

### Google Analytics
1. Создайте свойство в [Google Analytics](https://analytics.google.com)
2. Получите Measurement ID (формат: G-XXXXXXXXXX)
