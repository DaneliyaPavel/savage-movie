# CodeRabbit CLI - Настройка и использование

## Установка

CodeRabbit CLI уже установлен в системе. Если нужно переустановить:

```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
source ~/.zshrc  # или ~/.bashrc
```

## Аутентификация

Перед первым использованием необходимо выполнить аутентификацию:

```bash
coderabbit auth login
```

Команда откроет браузер для входа через GitHub (или другой провайдер). После входа скопируйте токен и вставьте его в терминал.

Проверка статуса аутентификации:

```bash
coderabbit auth status
```

## Конфигурация

Проект настроен с помощью файла `.coderabbit.yaml` в корне проекта. Конфигурация включает:

- **Тип ревью**: по умолчанию проверяются незакоммиченные изменения (`uncommitted`)
- **Базовая ветка**: `main`
- **Включенные пути**:
  - Frontend: `app/`, `components/`, `lib/` (TypeScript/JavaScript)
  - Backend: `backend/app/` (Python)
- **Исключенные пути**: `node_modules/`, `.next/`, `venv/`, тесты, миграции

## Использование

### Через npm скрипты (рекомендуется)

```bash
# Проверить незакоммиченные изменения (по умолчанию)
npm run review

# Проверить все изменения
npm run review:all

# Проверить только закоммиченные изменения
npm run review:committed

# Сравнить с веткой main
npm run review:main

# Минималистичный вывод для AI-агентов
npm run review:prompt
```

### Прямое использование CLI

```bash
# Базовое использование (проверяет незакоммиченные изменения)
coderabbit

# С текстовым выводом
coderabbit --plain

# Проверить все изменения
coderabbit --type all

# Сравнить с конкретной веткой
coderabbit --base main

# Минималистичный вывод для AI-агентов
coderabbit --prompt-only
```

## Интеграция с CI/CD

Для автоматического ревью в CI/CD пайплайне добавьте шаг:

```yaml
# Пример для GitHub Actions
- name: CodeRabbit Review
  run: |
    curl -fsSL https://cli.coderabbit.ai/install.sh | sh
    coderabbit auth login --token ${{ secrets.CODERABBIT_TOKEN }}
    coderabbit review --base main --plain
```

## Интеграция с Cursor/IDE

CodeRabbit CLI можно использовать с AI-агентами (например, Cursor):

```bash
npm run review:prompt
```

Этот режим выводит минималистичный отчет, который можно передать AI-агенту для автоматического исправления кода.

## Дополнительные команды

```bash
# Проверить версию CLI
coderabbit --version

# Получить справку
coderabbit --help

# Выйти из аккаунта
coderabbit auth logout
```

## Решение проблем

### CLI не найден

Убедитесь, что путь к CLI добавлен в PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Добавьте это в `~/.zshrc` или `~/.bashrc` для постоянного эффекта.

### Ошибка аутентификации

Выполните повторный вход:

```bash
coderabbit auth logout
coderabbit auth login
```

### Проблемы с конфигурацией

Проверьте файл `.coderabbit.yaml` в корне проекта. Убедитесь, что YAML синтаксис корректен.

## Документация

Полная документация CodeRabbit CLI: https://docs.coderabbit.ai/cli
