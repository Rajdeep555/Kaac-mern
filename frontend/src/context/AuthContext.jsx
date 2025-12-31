import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { http } from "../api/apiClient.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "app_auth";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const isAuthed = !!token;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setToken(parsed?.token ?? null);
      setUser(parsed?.user ?? null);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete http.defaults.headers.common.Authorization;
  }, [token]);

  const setSession = ({ token: t, user: u }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    setToken(t);
    setUser(u);
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const login = async ({ email, password }) => {
    const res = await http.post("/auth/login", { email, password });
    setSession({ token: res.data.token, user: res.data.user });
    return res.data;
  };

  const logout = () => clearSession();

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || null,
      isAuthed,
      login,
      logout,
    }),
    [token, user, isAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
