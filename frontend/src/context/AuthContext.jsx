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
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 min
const REFRESH_THRESHOLD = 5 * 60 * 1000; // refresh 5 min before expiry

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const inactivityTimer = useRef(null);
  const refreshTimer = useRef(null);
  const isAuthedRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const isLoggingInRef = useRef(false);
  const tokenRef = useRef(null); // ← tracks latest token for scheduleRefresh
  const clearSessionRef = useRef(null);
  const resetInactivityRef = useRef(null);
  const silentRefreshRef = useRef(null);
  const scheduleRefreshRef = useRef(null);

  const isAuthed = !!token;

  useEffect(() => {
    isAuthedRef.current = isAuthed;
  }, [isAuthed]);

  // Keep tokenRef in sync
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // ── Clear Session ──
  const clearSession = useCallback(() => {
    isLoggingOutRef.current = true;
    isLoggingInRef.current = false;
    delete http.defaults.headers.common.Authorization;
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    inactivityTimer.current = null;
    refreshTimer.current = null;
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 200);
  }, []);

  useEffect(() => {
    clearSessionRef.current = clearSession;
  }, [clearSession]);

  // ── Set Session ──
  const setSession = useCallback(({ token: t, user: u }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
    http.defaults.headers.common.Authorization = `Bearer ${t}`;
    setToken(t);
    setUser(u);
  }, []);

  // ── Schedule token refresh based on actual token expiry ──
  const scheduleRefresh = useCallback((overrideToken) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);

    const tok = overrideToken || tokenRef.current;
    if (!tok) return;

    let delay = INACTIVITY_LIMIT - REFRESH_THRESHOLD; // fallback: 25 min
    try {
      const payload = JSON.parse(atob(tok.split(".")[1]));
      const msUntilExpiry = payload.exp * 1000 - Date.now();
      delay = Math.max(msUntilExpiry - REFRESH_THRESHOLD, 0);
    } catch {
      // malformed token — use fallback delay
    }

    refreshTimer.current = setTimeout(() => {
      silentRefreshRef.current?.();
    }, delay);
  }, []);

  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh;
  }, [scheduleRefresh]);

  // ── Silent refresh ──
  const silentRefresh = useCallback(async () => {
    if (!isAuthedRef.current) return;
    try {
      const res = await http.post("/auth/refresh");
      const { token: newToken, user: newUser } = res.data;
      setSession({ token: newToken, user: newUser });
      scheduleRefreshRef.current?.(newToken); // pass new token explicitly
    } catch {
      clearSessionRef.current?.();
    }
  }, [setSession]);

  useEffect(() => {
    silentRefreshRef.current = silentRefresh;
  }, [silentRefresh]);

  // ── Reset inactivity timer ──
  // Also resets the refresh schedule so active users never get logged out
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthedRef.current) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      clearSessionRef.current?.();
    }, INACTIVITY_LIMIT);

    // ← KEY FIX: reschedule refresh on every activity so token stays fresh
    scheduleRefreshRef.current?.();
  }, []);

  useEffect(() => {
    resetInactivityRef.current = resetInactivityTimer;
  }, [resetInactivityTimer]);

  // ── Attach activity listeners ONCE ──
  useEffect(() => {
    const handleActivity = () => resetInactivityRef.current?.();
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    activityEvents.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true }),
    );
    return () => {
      activityEvents.forEach((e) =>
        window.removeEventListener(e, handleActivity),
      );
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  // ── Start/stop timers on auth state change ──
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

        // ← KEY FIX: reject already-expired tokens immediately
        const payload = JSON.parse(atob(savedToken.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) throw new Error("Token expired");

        http.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
        setToken(savedToken);
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
        const is401 = error.response?.status === 401;
        const isLoginEndpoint = error.config?.url?.includes("/auth/login");
        if (
          is401 &&
          !isLoggingOutRef.current &&
          !isLoggingInRef.current &&
          !isLoginEndpoint
        ) {
          clearSessionRef.current?.();
        }
        return Promise.reject(error);
      },
    );
    return () => http.interceptors.response.eject(interceptor);
  }, []);

  // ── Login ──
  const login = useCallback(
    async ({ email, password }) => {
      isLoggingInRef.current = true;
      isLoggingOutRef.current = false;
      delete http.defaults.headers.common.Authorization;
      try {
        const res = await http.post("/auth/login", { email, password });
        const { token, user } = res.data;
        setSession({ token, user });
        return res.data;
      } finally {
        isLoggingInRef.current = false;
      }
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
