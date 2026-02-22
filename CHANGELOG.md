# CHANGELOG

## Unreleased

### This Week's Highlights (2026-02-13 to 2026-02-18)

- Implemented a full course enrollment flow with form submission and guest payment.
- Fixed the responsive navigation so the mobile menu fits all screen sizes without scroll, and improved the footer.
- Updated backend configuration and added `.claude` to `.gitignore`.
- Added `CLAUDE.md` with project conventions and architecture notes.
- Consolidated repository-wide updates into a maintenance commit.

### Added

- Alembic migrations and config for the backend database.
- Repository layer for DB access.
- `ARCHITECTURE.md` with the current layered model.

### Changed

- Docker Compose now runs Alembic migrations on backend startup.
- Backend reorganized into delivery/application/infrastructure/interfaces.
- `init-docker.sh` no longer generates `.env`; env vars are loaded from the environment.

### Removed

- Legacy SQL bootstrap scripts (superseded by Alembic).
- Supabase client artifacts and `__v0_reference__` demo assets.

### Rollback notes

- Legacy SQL bootstrap: restore files from git history into `backend/scripts/` and
  re-add the volume mounts in `docker-compose.yml`.
- Backend layout: revert `backend/app/*` moves and import paths.
