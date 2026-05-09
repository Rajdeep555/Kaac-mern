import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import { http } from "../api/apiClient";

const AuthContext = createContext(null);
const STORAGE_KEY = "app_auth";
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 min → logout if idle
const REFRESH_THRESHOLD = 5 * 60 * 1000; // refresh token 5 min before expiry

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const inactivityTimer = useRef(null); // logout timer
  const refreshTimer = useRef(null); // token refresh timer
  const isAuthedRef = useRef(false);

  const isAuthed = !!token;

  useEffect(() => {
    isAuthedRef.current = isAuthed;
  }, [isAuthed]);

  // ── Clear Session ──
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    inactivityTimer.current = null;
    refreshTimer.current = null;
  }, []);

  // ── Set Session ──
  const setSession = useCallback(({ token: t, user: u }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    setToken(t);
    setUser(u);
  }, []);

  // ── Silently refresh the token ──
  const silentRefresh = useCallback(async () => {
    if (!isAuthedRef.current) return;
    try {
      const res = await http.post("/auth/refresh");
      const { token: newToken, user: newUser } = res.data;
      setSession({ token: newToken, user: newUser });
      scheduleRefresh(); // schedule next refresh
    } catch {
      clearSession(); // refresh failed → logout
    }
  }, []);

  // ── Schedule token refresh 5 min before 30min expiry = at 25min ──
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      silentRefresh();
    }, INACTIVITY_LIMIT - REFRESH_THRESHOLD); // fires at 25 min
  }, [silentRefresh]);

  // ── Reset inactivity timer on user activity ──
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthedRef.current) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      clearSession(); // idle for 30 min → logout
    }, INACTIVITY_LIMIT);
  }, [clearSession]);

  // ── Attach activity listeners ONCE ──
  useEffect(() => {
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    activityEvents.forEach((e) =>
      window.addEventListener(e, resetInactivityTimer, { passive: true }),
    );
    return () => {
      activityEvents.forEach((e) =>
        window.removeEventListener(e, resetInactivityTimer),
      );
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []); // attach once

  // ── Start both timers when user logs in, stop on logout ──
  useEffect(() => {
    if (isAuthed) {
      resetInactivityTimer();
      scheduleRefresh();
    } else {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    }
  }, [isAuthed]);

  // ── Restore session on app load ──
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

        const res = await http.get("/auth/me");
        setUser(res.data.user);
      } catch {
        clearSession();
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  // ── Keep axios header in sync ──
  useEffect(() => {
    if (token) {
      http.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete http.defaults.headers.common.Authorization;
    }
  }, [token]);

  // ── Axios 401 interceptor ──
  useEffect(() => {
    const interceptor = http.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) clearSession();
        return Promise.reject(error);
      },
    );
    return () => http.interceptors.response.eject(interceptor);
  }, [clearSession]);

  // ── Login ──
  const login = useCallback(
    async ({ email, password }) => {
      const res = await http.post("/auth/login", { email, password });
      const { token, user } = res.data;
      setSession({ token, user });
      return res.data;
    },
    [setSession],
  );

  // ── Logout ──
  const logout = useCallback(() => clearSession(), [clearSession]);

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
    [token, user, isAuthed, authLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
