"""
test_auth.py — Integration tests for /api/auth/* endpoints.

Covers:
  - POST /api/auth/register  (success, duplicate email, missing fields)
  - POST /api/auth/login     (success, wrong password, inactive account)
"""
import pytest


class TestRegister:
    """Tests for POST /api/auth/register"""

    def test_register_success(self, client):
        """Happy path: new user registers and receives a JWT token."""
        response = client.post("/api/auth/register", json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "Password@1",
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "alice@example.com"
        assert data["name"] == "Alice"
        assert data["user_id"] > 0
        assert data["message"] == "User created successfully"

    def test_register_trims_whitespace(self, client):
        """Email and name with leading/trailing spaces should be normalized."""
        response = client.post("/api/auth/register", json={
            "name": "  Bob  ",
            "email": "  BOB@EXAMPLE.COM  ",
            "password": "Password@1",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "bob@example.com"
        assert data["name"] == "Bob"

    def test_register_duplicate_email_returns_400(self, client):
        """Registering the same email twice should return 400."""
        payload = {
            "name": "Carol",
            "email": "carol@example.com",
            "password": "Password@1",
        }
        client.post("/api/auth/register", json=payload)   # first registration
        response = client.post("/api/auth/register", json=payload)  # duplicate
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_missing_name_returns_422(self, client):
        """Pydantic validation: missing required field returns 422."""
        response = client.post("/api/auth/register", json={
            "email": "noname@example.com",
            "password": "Password@1",
        })
        assert response.status_code == 422

    def test_register_missing_password_returns_422(self, client):
        response = client.post("/api/auth/register", json={
            "name": "Dave",
            "email": "dave@example.com",
        })
        assert response.status_code == 422

    def test_register_empty_body_returns_422(self, client):
        response = client.post("/api/auth/register", json={})
        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/auth/login"""

    def test_login_success(self, client, registered_user):
        """Happy path: correct credentials return a JWT token."""
        response = client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "Secure@123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "testuser@example.com"
        assert data["message"] == "Login successful"

    def test_login_wrong_password_returns_401(self, client, registered_user):
        """Wrong password must return 401 Unauthorized."""
        response = client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "WrongPassword!",
        })
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()

    def test_login_nonexistent_email_returns_401(self, client):
        """Login with an email that has never been registered → 401."""
        response = client.post("/api/auth/login", json={
            "email": "ghost@example.com",
            "password": "AnyPassword@1",
        })
        assert response.status_code == 401

    def test_login_missing_fields_returns_422(self, client):
        """Pydantic validation: missing email returns 422."""
        response = client.post("/api/auth/login", json={"password": "Password@1"})
        assert response.status_code == 422

    def test_login_inactive_user_returns_403(self, client, db_session):
        """An inactive account must be rejected with 403 even with correct password."""
        from sqlalchemy import select
        from app.models.user import User

        # Register user then manually deactivate them
        client.post("/api/auth/register", json={
            "name": "Inactive",
            "email": "inactive@example.com",
            "password": "Password@1",
        })
        user = db_session.scalar(select(User).where(User.email == "inactive@example.com"))
        user.status = "inactive"
        db_session.commit()

        response = client.post("/api/auth/login", json={
            "email": "inactive@example.com",
            "password": "Password@1",
        })
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()

    def test_login_token_is_usable(self, client, registered_user):
        """Token returned on login should successfully authenticate protected routes."""
        login_response = client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "Secure@123",
        })
        token = login_response.json()["token"]
        profile_response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert profile_response.status_code == 200
