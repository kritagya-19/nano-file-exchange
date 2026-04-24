export const API_BASE_URL = "http://localhost:8000/api";

const getAuthHeaders = () => {
  const raw = localStorage.getItem("nanofile_user");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.token) {
        return { Authorization: `Bearer ${parsed.token}` };
      }
    } catch (e) {
      console.error("Error parsing auth token", e);
    }
  }
  return {};
};

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // If body is an object and not FormData, stringify and add JSON content type
  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API request failed");
  }

  return response.json();
};
