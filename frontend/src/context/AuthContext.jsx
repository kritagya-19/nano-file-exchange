import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const AUTH_STORAGE_KEY = "nanofile_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.email) {
            setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setReady(true);
  }, []);

  const login = useCallback((payload) => {
    // Expected payload: { token: string, user_id: number, name: string, email: string }
    setUser(payload);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({ user, login, logout, ready }), [user, login, logout, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
