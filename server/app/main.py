from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy import text
import os

from app.routes import api_router
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models.plan import Plan


def _run_migrations():
    """Create tables and add new columns to existing tables."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"⚠ create_all skipped: {e}")

    alter_statements = [
        "ALTER TABLE files ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE",
        "ALTER TABLE files ADD COLUMN share_token VARCHAR(64) UNIQUE DEFAULT NULL",
        "ALTER TABLE files ADD COLUMN folder_id INT DEFAULT NULL",
        "ALTER TABLE messages ADD COLUMN file_id INT DEFAULT NULL",
        "ALTER TABLE messages ADD COLUMN is_deleted_for_everyone BOOLEAN DEFAULT FALSE"
    ]
    fk_statements = [
        "ALTER TABLE files ADD CONSTRAINT fk_files_folder FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE SET NULL",
        "ALTER TABLE messages ADD CONSTRAINT fk_message_file FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE SET NULL"
    ]
    try:
        with engine.connect() as conn:
            for sql in alter_statements:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                except Exception:
                    conn.rollback()
            try:
                for fk_sql in fk_statements:
                    conn.execute(text(fk_sql))
                conn.commit()
            except Exception:
                conn.rollback()
    except Exception as e:
        print(f"⚠ Column migrations skipped: {e}")


def _seed_plans():
    """Seed default plans if the plans table is empty."""
    import json
    db = SessionLocal()
    try:
        existing = db.query(Plan).count()
        if existing > 0:
            return   # Plans already exist

        defaults = [
            Plan(
                plan_key="free",
                name="Free",
                storage_limit_gb=20,
                monthly_price=0,
                annual_price=0,
                features=json.dumps([
                    "20 GB Storage",
                    "Up to 500 MB per file",
                    "5 active group chats",
                    "20 shared links",
                    "Standard upload speed",
                    "Basic file management",
                    "Community support",
                ]),
            ),
            Plan(
                plan_key="pro",
                name="Pro",
                storage_limit_gb=300,
                monthly_price=499,
                annual_price=399,
                features=json.dumps([
                    "300 GB Storage",
                    "Up to 10 GB per file",
                    "Unlimited group chats",
                    "Unlimited shared links",
                    "Priority upload speed",
                    "Advanced file management",
                    "Folder organization",
                    "Priority email support",
                    "File version history (60 days)",
                ]),
            ),
            Plan(
                plan_key="max",
                name="Max",
                storage_limit_gb=1024,
                monthly_price=1999,
                annual_price=1499,
                features=json.dumps([
                    "1 TB Storage",
                    "Up to 50 GB per file",
                    "Unlimited group chats",
                    "Unlimited shared links",
                    "Blazing fast upload speed",
                    "Advanced file management",
                    "Unlimited folders",
                    "Dedicated priority support",
                    "File version history (Forever)",
                    "Custom branding",
                    "REST API access",
                    "Advanced analytics dashboard",
                ]),
            ),
        ]
        db.add_all(defaults)
        db.commit()
        print("✅ Default plans seeded into database")
    except Exception as e:
        db.rollback()
        print(f"⚠ Plan seeding skipped: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run migrations and seed data
    _run_migrations()
    _seed_plans()
    yield
    # Shutdown: nothing needed


app = FastAPI(
    title="🛰️ Nano Exchange API",
    description="File Transfer and Group Chat System API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Mount uploads directory for static file access
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/files/download", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include all API routes under /api
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Welcome to Nano Exchange API. See /docs for Swagger UI documentation."}
