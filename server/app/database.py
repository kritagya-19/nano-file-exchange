from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,        # Verify connections are alive before use
    pool_size=10,              # Keep 10 persistent connections in the pool
    max_overflow=20,           # Allow up to 20 extra connections under load (30 total max)
    pool_recycle=1800,         # Recycle connections after 30 min (prevents MySQL 'gone away')
    echo=False,                # Disable SQL logging in production for speed
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
