"""
conftest.py — Shared pytest fixtures for the Nano Exchange test suite.

Architecture:
  - A single in-memory SQLite DB is created once per session.
  - Tables are created fresh, then torn down at the end.
  - Each test gets a clean DB via a transaction rollback strategy,
    so tests are fully isolated without re-creating the schema.
  - The FastAPI app's DB dependency is overridden to use the test DB.
  - Plans are seeded once at session start (mirrors app lifespan behaviour).
"""
import os
import json
import pytest

# ── Patch env BEFORE any app modules are imported (config reads at import) ──
# DB_URL is intentionally NOT set here — the test engine uses in-memory SQLite
# (see TEST_DB_URL below), and the app's get_db is overridden per-test.
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

from sqlalchemy import create_engine, event              # noqa: E402
from sqlalchemy.orm import sessionmaker                   # noqa: E402
from sqlalchemy.pool import StaticPool                   # noqa: E402
from fastapi.testclient import TestClient                # noqa: E402

from app.main import app                                 # noqa: E402
from app.database import Base, get_db                    # noqa: E402
from app.models.plan import Plan                         # noqa: E402
from app.utils.security import create_access_token       # noqa: E402

# ── Test database engine (in-memory, single connection via StaticPool) ──────
TEST_DB_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,       # All connections share the same in-memory DB
)

# Enable SQLite foreign key enforcement (off by default in SQLite)
@event.listens_for(engine, "connect")
def enable_sqlite_fks(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Session-scoped: create all tables once, drop them when suite finishes ────
@pytest.fixture(scope="session", autouse=True)
def _create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ── Session-scoped: seed default plans once (mirrors app lifespan) ───────────
@pytest.fixture(scope="session", autouse=True)
def _seed_plans(_create_tables):
    """
    Insert the three default plans (free/pro/max) into the test DB once.
    This mirrors what _seed_plans() does in main.py's lifespan, which does
    not run during TestClient usage when the DB dependency is overridden.
    """
    session = TestingSessionLocal()
    try:
        if session.query(Plan).count() > 0:
            return   # Already seeded (safety guard)

        defaults = [
            Plan(
                plan_key="free", name="Free",
                storage_limit_gb=20, monthly_price=0, annual_price=0,
                features=json.dumps(["20 GB Storage", "Up to 500 MB per file"]),
            ),
            Plan(
                plan_key="pro", name="Pro",
                storage_limit_gb=300, monthly_price=499, annual_price=399,
                features=json.dumps(["300 GB Storage", "Up to 10 GB per file"]),
            ),
            Plan(
                plan_key="max", name="Max",
                storage_limit_gb=1024, monthly_price=1999, annual_price=1499,
                features=json.dumps(["1 TB Storage", "Up to 50 GB per file"]),
            ),
        ]
        session.add_all(defaults)
        session.commit()
    finally:
        session.close()


# ── Function-scoped: each test runs inside a rolled-back transaction ─────────
@pytest.fixture()
def db_session():
    """
    Yields a SQLAlchemy session that is rolled back after every test,
    keeping the DB clean between tests without re-creating the schema.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ── Override the app's DB dependency to use the test session ─────────────────
@pytest.fixture()
def client(db_session):
    """
    Returns a TestClient wired to the test DB.
    The app's `get_db` dependency is overridden per-test.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # Rollback handled by db_session fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


# ── Helpers: create a registered user and get auth headers ───────────────────
@pytest.fixture()
def registered_user(client):
    """Register a fresh test user and return the full API response payload."""
    payload = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "Secure@123",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200, f"Registration failed: {response.text}"
    return response.json()


@pytest.fixture()
def auth_headers(registered_user):
    """Return Bearer auth headers for the registered test user."""
    return {"Authorization": f"Bearer {registered_user['token']}"}


@pytest.fixture()
def second_user(client):
    """Register a second test user for isolation/conflict tests."""
    payload = {
        "name": "Second User",
        "email": "seconduser@example.com",
        "password": "AnotherPass@1",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200
    return response.json()
