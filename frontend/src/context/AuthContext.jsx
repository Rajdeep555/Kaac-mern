import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { http } from "../api/apiClient";

const AuthContext = createContext(null);
const STORAGE_KEY = "app_auth";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isAuthed = !!token;

  // ===============================
  // Restore session on app load
  // ===============================
  useEffect(() => {
    const initAuth = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setAuthLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const savedToken = parsed?.token;

        if (!savedToken) throw new Error("No token");

        setToken(savedToken);
        http.defaults.headers.common.Authorization = `Bearer ${savedToken}`;

        // 🔥 VERIFY TOKEN WITH BACKEND
        const res = await http.get("/auth/me");
        setUser(res.data.user);
      } catch (error) {
        clearSession();
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  // ===============================
  // Keep axios header updated
  // ===============================
  useEffect(() => {
    if (token) {
      http.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete http.defaults.headers.common.Authorization;
    }
  }, [token]);

  // ===============================
  // Set Session
  // ===============================
  const setSession = ({ token: t, user: u }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    setToken(t);
    setUser(u);
  };

  // ===============================
  // Clear Session
  // ===============================
  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  // ===============================
  // Login
  // ===============================
  const login = async ({ email, password }) => {
    const res = await http.post("/auth/login", { email, password });

    const { token, user } = res.data;

    setSession({ token, user });

    return res.data;
  };

  // ===============================
  // Logout
  // ===============================
  const logout = () => {
    clearSession();
  };

  // ===============================
  // Context Value
  // ===============================
  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || null,
      isAuthed,
      authLoading,
      login,
      logout,
    }),
    [token, user, isAuthed, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }
  return ctx;
}
