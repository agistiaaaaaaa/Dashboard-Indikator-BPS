import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AccessDeniedPanel } from "./AccessDeniedPanel";
import { useAuth } from "./AuthContext";
import type { Role } from "./roles";

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

/**
 * Route/UI gate: role authorization.
 * Not a substitute for backend authorization.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { ready, authenticated, hasRole } = useAuth();

  if (!ready) {
    return (
      <div className="auth-boot" role="status" aria-live="polite">
        <p>Memuat sesi…</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(...roles)) {
    return (
      <AccessDeniedPanel description="Peran Anda tidak diizinkan membuka halaman ini." />
    );
  }

  return children;
}
