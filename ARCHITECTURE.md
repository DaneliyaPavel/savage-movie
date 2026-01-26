# ARCHITECTURE

## Overview

- Frontend: Next.js App Router in `app/`, UI primitives in `components/`, shared logic in `lib/`.
- Backend: FastAPI in `backend/app` with a layered structure aligned to Clean Architecture.
- Database: PostgreSQL with SQLAlchemy (async) and Alembic migrations.

## Backend Layers (Clean-ish)

- `backend/app/delivery/`: HTTP entrypoints (FastAPI routers).
- `backend/app/interfaces/`: DTOs and Pydantic schemas.
- `backend/app/application/`: application services and use-case orchestration.
- `backend/app/infrastructure/`: DB session, SQLAlchemy models, repositories, and external integrations.

Dependency intent:

- Delivery depends on Interfaces + Application (+ Infrastructure for repositories).
- Application should not depend on Delivery.
- Infrastructure is isolated and accessed via repositories.
- A dedicated Domain layer is not carved out yet; business rules live in Application and repositories.

If domain complexity grows, introduce `backend/app/domain` and move pure business logic there.

## Request Flow (Backend)

1. HTTP request -> `delivery/api/*` router.
2. Request validation via `interfaces/schemas/*`.
3. Business logic in `application/services/*` and `infrastructure/db/repositories/*`.
4. SQLAlchemy models persist data.
5. Response serialized with DTOs.

## Database & Migrations

- Alembic config: `backend/alembic.ini`.
- Migrations: `backend/alembic/versions/*`.
- Apply migrations: `alembic -c backend/alembic.ini upgrade head`.

## Frontend Structure

- `app/(marketing)` and `app/admin` contain user-facing pages.
- Reusable UI is in `components/`.
- API clients live in `lib/api`.

## Operational Notes

- Docker Compose runs Alembic migrations on backend start.
- Legacy SQL bootstrap scripts were removed; restore from git history if needed.

## References

- `PROJECT_STRUCTURE.md` for a full tree.
- `TARGET_STRUCTURE.md` for the intended layout and decisions.
