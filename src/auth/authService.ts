/**
 * Auth service seam — UI talks only to this module.
 * Storage/API details stay inside the selected provider.
 */

import { authProvider } from "./providers";
import type {
  AuthCredentials,
  AuthResult,
  AuthSessionState,
  AuthUser,
} from "./types";

export type {
  AuthCredentials,
  AuthResult,
  AuthSession,
  AuthSessionState,
  AuthUser,
} from "./types";

export { ROLES, ROLE_LABELS, isRole, type Role } from "./roles";
export {
  PERMISSIONS,
  WORKSPACE_NAV,
  getWorkspaceNavForRole,
  roleHasPermission,
  type Permission,
  type WorkspaceNavItem,
} from "./permissions";

export async function login(credentials: AuthCredentials): Promise<AuthResult> {
  return authProvider.login(credentials);
}

export async function logout(): Promise<void> {
  return authProvider.logout();
}

export async function getSession(): Promise<AuthSessionState> {
  return authProvider.getSession();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await authProvider.getSession();
  return session.authenticated ? session.user : null;
}

export function getAuthMode(): "development-mock" | "local-api" | "bps" {
  return authProvider.mode;
}

export function isDevelopmentAuthMode(): boolean {
  return authProvider.mode === "development-mock";
}

export function isLocalApiAuthMode(): boolean {
  return authProvider.mode === "local-api";
}
