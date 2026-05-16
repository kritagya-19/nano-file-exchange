"""
test_users.py — Integration tests for /api/users/* endpoints.

Covers:
  - GET  /api/users/me              (authenticated, unauthenticated)
  - PATCH /api/users/me             (update name, validation)
  - POST  /api/users/me/change-password  (success, wrong current, weak new)
"""
import pytest


class TestGetProfile:
    """Tests for GET /api/users/me"""

    def test_get_profile_success(self, client, auth_headers, registered_user):
        """Authenticated user retrieves their own profile."""
        response = client.get("/api/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user["email"]
        assert data["name"] == registered_user["name"]
        assert data["user_id"] == registered_user["user_id"]
        assert data["status"] == "active"
        # Stats fields must be present
        assert "total_files" in data
        assert "storage_used" in data
        assert "active_groups" in data
        assert "shared_files" in data

    def test_get_profile_unauthenticated_returns_403(self, client):
        """No token → FastAPI's HTTPBearer returns 403 (not 401, by design)."""
        response = client.get("/api/users/me")
        assert response.status_code == 403

    def test_get_profile_invalid_token_returns_401(self, client):
        """A malformed JWT must be rejected."""
        response = client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer this.is.not.a.jwt"}
        )
        assert response.status_code == 401

    def test_fresh_user_has_zero_stats(self, client, auth_headers):
        """A brand-new user should have 0 files, 0 storage, 0 groups."""
        response = client.get("/api/users/me", headers=auth_headers)
        data = response.json()
        assert data["total_files"] == 0
        assert data["storage_used"] == 0
        assert data["active_groups"] == 0


class TestUpdateProfile:
    """Tests for PATCH /api/users/me"""

    def test_update_name_success(self, client, auth_headers):
        """User can change their display name."""
        response = client.patch(
            "/api/users/me",
            json={"name": "Updated Name"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["message"] == "Profile updated successfully"
        # A new token should be returned so the frontend can refresh
        assert "token" in data

    def test_update_name_reflected_on_next_get(self, client, auth_headers):
        """After updating, GET /me should return the new name."""
        client.patch("/api/users/me", json={"name": "Refreshed"}, headers=auth_headers)
        response = client.get("/api/users/me", headers=auth_headers)
        assert response.json()["name"] == "Refreshed"

    def test_update_name_too_short_returns_400(self, client, auth_headers):
        """Name shorter than 2 chars must be rejected."""
        response = client.patch(
            "/api/users/me",
            json={"name": "X"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "2 characters" in response.json()["detail"]

    def test_update_name_too_long_returns_400(self, client, auth_headers):
        """Name longer than 100 chars must be rejected."""
        response = client.patch(
            "/api/users/me",
            json={"name": "A" * 101},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "100 characters" in response.json()["detail"]

    def test_update_with_empty_body_keeps_name(self, client, auth_headers, registered_user):
        """Sending an empty body (no fields) should not change the name."""
        response = client.patch("/api/users/me", json={}, headers=auth_headers)
        assert response.status_code == 200
        # Name unchanged
        profile = client.get("/api/users/me", headers=auth_headers).json()
        assert profile["name"] == registered_user["name"]

    def test_update_unauthenticated_returns_403(self, client):
        response = client.patch("/api/users/me", json={"name": "Hacker"})
        assert response.status_code == 403


class TestChangePassword:
    """Tests for POST /api/users/me/change-password"""

    def test_change_password_success(self, client, auth_headers):
        """Happy path: correct current password, strong new password."""
        response = client.post(
            "/api/users/me/change-password",
            json={
                "current_password": "Secure@123",
                "new_password": "NewSecure@456",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password changed successfully"
        assert "token" in data

    def test_change_password_wrong_current_returns_400(self, client, auth_headers):
        """Wrong current password must be rejected."""
        response = client.post(
            "/api/users/me/change-password",
            json={
                "current_password": "WrongCurrent!",
                "new_password": "NewSecure@456",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()

    def test_change_password_same_as_current_returns_400(self, client, auth_headers):
        """New password identical to current should be rejected."""
        response = client.post(
            "/api/users/me/change-password",
            json={
                "current_password": "Secure@123",
                "new_password": "Secure@123",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "different" in response.json()["detail"].lower()

    @pytest.mark.parametrize("weak_password,expected_fragment", [
        ("short1!A",    None),            # < 8 chars — actually 8, passes; use shorter
        ("nouppercase@1", "uppercase"),
        ("NOLOWERCASE@1", "lowercase"),
        ("NoNumbers@NoNum", "number"),
        ("NoSpecial123",   "special"),
        ("abc",            "8 characters"),
    ])
    def test_weak_new_password_rejected(self, client, auth_headers, weak_password, expected_fragment):
        """Each password rule violation returns a descriptive 400 error."""
        if expected_fragment is None:
            pytest.skip("Edge case skipped")
        response = client.post(
            "/api/users/me/change-password",
            json={
                "current_password": "Secure@123",
                "new_password": weak_password,
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert expected_fragment in response.json()["detail"].lower()

    def test_new_token_authenticates_after_password_change(self, client, auth_headers):
        """The token returned after a password change should still be valid."""
        change_response = client.post(
            "/api/users/me/change-password",
            json={"current_password": "Secure@123", "new_password": "NewSecure@456"},
            headers=auth_headers,
        )
        new_token = change_response.json()["token"]
        profile = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {new_token}"}
        )
        assert profile.status_code == 200
