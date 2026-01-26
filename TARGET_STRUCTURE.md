# Целевая структура и план реорганизации

## Цели
- Привести backend к Clean Architecture (Domain / Application / Interface Adapters / Infrastructure / Delivery).
- Сохранить текущие публичные API и контракты, минимизировать breaking changes.
- Сделать миграции БД воспроизводимыми и контролируемыми.
- Упростить навигацию по проекту и снизить технический долг.

## Предлагаемая структура (высокий уровень)

```
savage-movie/
├── app/                          # Next.js App Router (без изменений по root)
├── components/
├── lib/
├── types/
├── backend/
│   ├── app/
│   │   ├── delivery/             # FastAPI routers, dependencies, http-слой
│   │   │   ├── api/
│   │   │   └── dependencies/
│   │   ├── interfaces/           # DTO (Pydantic), мапперы
│   │   │   ├── schemas/
│   │   │   └── mappers/
│   │   ├── application/          # use-cases, application services
│   │   │   ├── use_cases/
│   │   │   └── services/
│   │   ├── domain/               # доменные сущности, правила, ошибки
│   │   │   ├── entities/
│   │   │   └── exceptions/
│   │   ├── infrastructure/       # ORM, репозитории, внешние интеграции
│   │   │   ├── db/
│   │   │   │   ├── models/        # SQLAlchemy модели
│   │   │   │   ├── repositories/  # реализации repo
│   │   │   │   └── session.py
│   │   │   ├── migrations/        # Alembic (если утвердим)
│   │   │   └── integrations/      # email/oauth/payments/storage
│   │   ├── config.py
│   │   └── main.py
│   ├── scripts/                  # вспомогательные скрипты (минимум)
│   └── tests/
```

Примечание: frontend структуру меняем минимально, чтобы не ломать Next.js routing. Основной фокус — backend.

## План миграции (батчи)

### A) Подготовка инфраструктуры проекта
- Создать новые директории слоев backend (`delivery/`, `interfaces/`, `application/`, `domain/`, `infrastructure/`).
- Настроить алиасы/импорты для backend (единый стиль импорта).
- Добавить/уточнить lint/typecheck для Python (минимально: ruff + mypy, если уместно).
- Обновить документацию по запуску и переменным окружения.

### B) Перенос/разделение слоев и модулей
- Переместить Pydantic-схемы в `interfaces/schemas`.
- Вынести схемы, объявленные в роутерах (например, контактная форма), в слой interfaces.
- Перенести роутеры в `delivery/api`, сохранив маршруты и сигнатуры.
- Добавить мапперы (если нужен перевод ORM -> DTO).

### C) Приведение ORM слоя к каноничной структуре
- Переместить SQLAlchemy модели в `infrastructure/db/models`.
- Ввести интерфейсы репозиториев (domain) и реализации (infrastructure).
- Создать use-cases в `application/use_cases`, адаптировать контроллеры.
- Принять Alembic как единый механизм миграций.

### D) Удаление/очистка
- Удалить legacy-артефакты (Supabase, `__v0_reference__`, дубль-скрипты) после проверки реальных импортов/использования.
- Удалить окончательно только после прохождения тестов и smoke-проверок.

### E) Финальная полировка
- Валидации, обработка ошибок, логирование.
- Обновить README и добавить ARCHITECTURE.md.
- Зафиксировать TARGET_STRUCTURE.md как часть архитектурной документации.

## Проверки после каждого батча
- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run build`
- Backend: минимальные smoke-тесты (health check) + запуск/дымовой прогон

## Принятые решения
1) Supabase и `supabase/*` — legacy, удалены.
2) Alembic — единый механизм миграций.
3) Реальные `.env` удалены из репозитория; оставлены `.env.example`.
