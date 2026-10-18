import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Route gate: authentication required.
 * UI-only; backend must enforce independently when available.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { ready, authenticated } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="auth-boot" role="status" aria-live="polite">
        <p>Memuat sesi…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
}
