"""
test_health.py — Basic smoke tests (kept lightweight, run first).

These are the first tests pytest discovers. If these fail, the whole
suite is likely broken at the import/startup level.
"""
import os

os.environ.setdefault("DB_URL", "sqlite:///./test_integration.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

from app.main import app  # noqa: E402


class TestAppStartup:
    """Verify the FastAPI app object is importable and configured correctly."""

    def test_app_title_contains_nano(self):
        assert "Nano" in app.title

    def test_app_has_routes(self):
        routes = [r.path for r in app.routes]
        assert len(routes) > 0

    def test_app_has_api_prefix_routes(self):
        paths = [r.path for r in app.routes]
        assert any("/api" in p for p in paths)
