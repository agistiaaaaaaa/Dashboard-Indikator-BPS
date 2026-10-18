import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AccessDeniedPanel } from "./AccessDeniedPanel";
import { useAuth } from "./AuthContext";
import type { Permission } from "./permissions";

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
}

/**
 * Route/UI gate: permission authorization.
 * Defense-in-depth only — not a production security boundary.
 */
export function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const { ready, authenticated, hasPermission } = useAuth();

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

  if (!hasPermission(permission)) {
    return (
      <AccessDeniedPanel description="Peran Anda tidak memiliki izin untuk modul ini." />
    );
  }

  return children;
}
