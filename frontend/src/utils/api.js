export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getAuthToken = () => {
  const raw = localStorage.getItem("nanofile_user");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    throw new Error("Cannot connect to server. Please make sure the backend is running.");
  }

  if (!response.ok) {
    // 401 = token expired/invalid → clear credentials and redirect to login.
    // 403 = authenticated but not authorized for this resource → let the component handle it.
    // IMPORTANT: 403 should NEVER trigger logout. It's expected for non-admin members
    // accessing admin-only endpoints (e.g., /groups/{id}/requests).
    if (response.status === 401) {
      const isPublicEndpoint = endpoint.includes("/invite/") || endpoint.includes("/share/") || endpoint.startsWith("/auth/");
      if (!isPublicEndpoint && typeof window !== "undefined") {
        localStorage.removeItem("nanofile_user");
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/invite/")) {
          window.location.href = "/login";
        }
      }
    }
    
    let errorMsg = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = errorData.detail;
    } catch {
      // Response wasn't JSON — try plain text
      try {
        const text = await response.text();
        if (text) errorMsg = text;
      } catch { /* ignore */ }
    }
    throw new Error(errorMsg);
  }

  return response.json();
};

/**
 * Upload a file using XMLHttpRequest for real-time progress tracking.
 * Returns { xhr, promise } so caller can abort/pause.
 *
 * onProgress(percent) — 0-100
 */
export function uploadFileWithProgress(file, folderId, onProgress) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);
  if (folderId) formData.append("folder_id", String(folderId));

  const promise = new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 401) {
        localStorage.removeItem("nanofile_user");
        window.location.href = "/login";
        reject(new Error("Session expired"));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({});
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", `${API_BASE_URL}/files/upload`);
    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });

  return { xhr, promise };
}

/**
 * Chunked upload for large files. Sends file in CHUNK_SIZE byte pieces.
 * Returns a controller object: { promise, abort(), uploadId }
 *
 * onProgress(percent) — overall 0-100
 */
export function uploadFileChunked(file, folderId, onProgress) {
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = crypto.randomUUID().replace(/-/g, "");
  let aborted = false;
  let currentXhr = null;
  let uploadedChunks = 0;

  const promise = new Promise(async (resolve, reject) => {
    for (let i = 0; i < totalChunks; i++) {
      if (aborted) {
        reject(new Error("Upload aborted"));
        return;
      }

      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk, `chunk_${i}`);
      formData.append("upload_id", uploadId);
      formData.append("chunk_index", String(i));
      formData.append("total_chunks", String(totalChunks));
      formData.append("file_name", file.name);
      formData.append("total_size", String(file.size));
      if (folderId) formData.append("folder_id", String(folderId));

      try {
        await new Promise((chunkResolve, chunkReject) => {
          const xhr = new XMLHttpRequest();
          currentXhr = xhr;

          xhr.addEventListener("load", () => {
            if (xhr.status === 401) {
              localStorage.removeItem("nanofile_user");
              window.location.href = "/login";
              chunkReject(new Error("Session expired"));
              return;
            }
            if (xhr.status >= 200 && xhr.status < 300) {
              uploadedChunks++;
              onProgress(Math.round((uploadedChunks / totalChunks) * 100));
              try {
                chunkResolve(JSON.parse(xhr.responseText));
              } catch {
                chunkResolve({});
              }
            } else {
              try {
                const err = JSON.parse(xhr.responseText);
                chunkReject(new Error(err.detail || "Chunk upload failed"));
              } catch {
                chunkReject(new Error("Chunk upload failed"));
              }
            }
          });

          xhr.addEventListener("error", () => chunkReject(new Error("Network error")));
          xhr.addEventListener("abort", () => chunkReject(new Error("Upload aborted")));

          xhr.open("POST", `${API_BASE_URL}/files/upload/chunk`);
          const token = getAuthToken();
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (err) {
        reject(err);
        return;
      }
    }
    // After all chunks uploaded, the last chunk response contains file info
    resolve({ status: "complete" });
  });

  return {
    promise,
    uploadId,
    abort() {
      aborted = true;
      if (currentXhr) currentXhr.abort();
    },
    getUploadedChunks() {
      return uploadedChunks;
    },
  };
}
