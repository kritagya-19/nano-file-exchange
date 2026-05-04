/**
 * Admin API utilities — separate token storage from regular user auth.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const ADMIN_KEY = "nanofile_admin";

export function getAdminToken() {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (raw) {
    try {
      return JSON.parse(raw).token || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function getAdminData() {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export function setAdminData(data) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
}

export function clearAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}

export async function adminFetch(endpoint, options = {}) {
  const token = getAdminToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error("Cannot connect to server.");
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAdmin();
      if (!window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    let errorMsg = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = errorData.detail;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
