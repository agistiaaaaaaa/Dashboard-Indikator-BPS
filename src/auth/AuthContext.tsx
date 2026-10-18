import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SESSION_EXPIRED_EVENT } from "../lib/api";
import {
  getSession,
  login as authLogin,
  logout as authLogout,
  isDevelopmentAuthMode,
  type AuthCredentials,
  type AuthResult,
  type AuthUser,
} from "./authService";
import { roleHasPermission, type Permission } from "./permissions";
import type { Role } from "./roles";

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  isDevAuth: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (...roles: Role[]) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshSession = useCallback(async () => {
    const session = await getSession();
    setUser(session.authenticated ? session.user : null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshSession();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      const path = window.location.pathname;
      if (path.startsWith("/workspace")) {
        const returnUrl = encodeURIComponent(path + window.location.search);
        window.location.assign(`/login?returnUrl=${returnUrl}`);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const result = await authLogin(credentials);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      authenticated: Boolean(user),
      user,
      isDevAuth: isDevelopmentAuthMode(),
      login,
      logout,
      refreshSession,
      hasPermission: (permission) =>
        user ? roleHasPermission(user.role, permission) : false,
      hasRole: (...roles) => (user ? roles.includes(user.role) : false),
    }),
    [ready, user, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
