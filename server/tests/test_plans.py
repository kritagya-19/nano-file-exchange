"""
test_plans.py — Integration tests for /api/plans/* endpoints.

Plans is a public endpoint (no auth required) that serves pricing config.
Covers:
  - GET /api/plans/  (returns all seeded plans with correct structure)
"""


class TestGetPlans:
    """Tests for GET /api/plans/"""

    def test_plans_returns_200(self, client):
        """Plans endpoint is public — no auth required."""
        response = client.get("/api/plans/")
        assert response.status_code == 200

    def test_plans_response_structure(self, client):
        """Response must have a top-level 'plans' key that is a dict."""
        data = client.get("/api/plans/").json()
        assert "plans" in data
        assert isinstance(data["plans"], dict)

    def test_plans_seeded_keys_present(self, client):
        """The three default plans (free, pro, max) must be seeded on startup."""
        plans = client.get("/api/plans/").json()["plans"]
        assert "free" in plans
        assert "pro" in plans
        assert "max" in plans

    def test_free_plan_fields(self, client):
        """Each plan must have the required pricing/storage fields."""
        free = client.get("/api/plans/").json()["plans"]["free"]
        assert free["name"] == "Free"
        assert free["monthly_price"] == 0
        assert free["annual_price"] == 0
        assert free["storage_limit_gb"] == 20
        assert isinstance(free["features"], list)
        assert len(free["features"]) > 0

    def test_pro_plan_is_paid(self, client):
        """Pro plan must have non-zero pricing."""
        pro = client.get("/api/plans/").json()["plans"]["pro"]
        assert pro["monthly_price"] > 0
        assert pro["annual_price"] > 0
        assert pro["storage_limit_gb"] == 300

    def test_max_plan_has_most_storage(self, client):
        """Max plan should have more storage than pro."""
        plans = client.get("/api/plans/").json()["plans"]
        assert plans["max"]["storage_limit_gb"] > plans["pro"]["storage_limit_gb"]

    def test_plans_does_not_require_auth(self, client):
        """Explicitly verify no Authorization header needed."""
        response = client.get("/api/plans/")
        assert response.status_code == 200   # NOT 401 or 403


class TestHealthEndpoint:
    """Tests for GET /api/ (health route)"""

    def test_health_returns_200(self, client):
        response = client.get("/api/")
        assert response.status_code == 200

    def test_health_response_fields(self, client):
        data = client.get("/api/").json()
        assert data["status"] == "healthy"
        assert data["service"] == "nano_exchange_api"

    def test_root_returns_200(self, client):
        """The non-prefixed root also works."""
        response = client.get("/")
        assert response.status_code == 200

    def test_openapi_schema_accessible(self, client):
        """OpenAPI schema should be available (confirms all routes mounted OK)."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "paths" in schema
        # Spot-check key routes exist in the schema
        paths = schema["paths"]
        assert any("/auth/register" in p for p in paths)
        assert any("/auth/login" in p for p in paths)
        assert any("/users/me" in p for p in paths)
        assert any("/plans" in p for p in paths)
