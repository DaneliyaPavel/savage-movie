import asyncio
import sys
import os
import traceback

# Try adding current directory to path
sys.path.append(os.getcwd())

try:
    from app.infrastructure.db.session import AsyncSessionLocal
    from app.infrastructure.db.models.project import Project
    from sqlalchemy import select
except ImportError:
    # If specifically running in the container where /app/backend is the root or /app is the root
    sys.path.append("/app")
    try:
        from app.infrastructure.db.session import AsyncSessionLocal
        from app.infrastructure.db.models.project import Project
        from sqlalchemy import select
    except ImportError as e:
        print("Could not import app modules. Current path:", sys.path)
        print("Current directory:", os.getcwd())
        print("Directory listing:", os.listdir())
        traceback.print_exc()
        sys.exit(1)

async def main():
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Project))
            projects = result.scalars().all()
            print(f"Found {len(projects)} projects:")
            for p in projects:
                print(f"ID: {p.id}, Slug: {p.slug}, Title: {p.title}")
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
