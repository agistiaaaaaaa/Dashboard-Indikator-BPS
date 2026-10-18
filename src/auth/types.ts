/**
 * Authentication domain types — provider-agnostic.
 * Real BPS backend will map its responses into these shapes.
 */

import type { Role } from "./roles";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthSession {
  authenticated: true;
  user: AuthUser;
  /** ISO timestamp when present; null if provider does not support expiry. */
  expiresAt: string | null;
  /** Opaque session identifier from the auth provider (not a password). */
  sessionId: string;
}

export type AuthSessionState = AuthSession | { authenticated: false };

export type AuthResult =
  | { success: true; user: AuthUser; session: AuthSession }
  | { success: false; error: string };

export interface AuthProvider {
  readonly mode: "development-mock" | "local-api" | "bps";
  login(credentials: AuthCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSessionState>;
}
