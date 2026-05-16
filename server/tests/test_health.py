"""
Smoke tests for the Nano Exchange FastAPI backend.

These tests use SQLite in-memory so they work in CI without any
real database credentials. Environment variables are patched before
any app modules are imported.
"""
import os
import pytest

# ── Patch env BEFORE importing the app (config is read at import time) ──
os.environ.setdefault("DB_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "ci-test-secret-key-not-for-production")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app                   # noqa: E402


@pytest.fixture(scope="module")
def client():
    """Provide a TestClient with the app's lifespan (DB init) executed."""
    with TestClient(app) as c:
        yield c


class TestRootEndpoint:
    """Basic sanity check — server boots and root route responds."""

    def test_root_returns_200(self, client):
        response = client.get("/")
        assert response.status_code == 200

    def test_root_has_message(self, client):
        data = response = client.get("/")
        data = response.json()
        assert "message" in data
        assert "Nano" in data["message"]


class TestAppStartup:
    """Verify the app initializes without crashing."""

    def test_app_title(self):
        assert "Nano" in app.title

    def test_openapi_schema_loads(self, client):
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema
