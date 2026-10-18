/**
 * ============================================================================
 * DEVELOPMENT-ONLY mock authentication provider
 * ============================================================================
 *
 * Production authentication is NOT implemented because the official
 * BPS authentication/backend contract has not yet been provided.
 *
 * This adapter exists solely so the UI/architecture can be developed
 * and reviewed. It is NOT production-secure.
 *
 * Future: replace with BpsAuthProvider that calls the official BPS API.
 * ============================================================================
 */

import { ROLES } from "../roles";
import type {
  AuthCredentials,
  AuthProvider,
  AuthResult,
  AuthSession,
  AuthSessionState,
  AuthUser,
} from "../types";

const GENERIC_AUTH_ERROR =
  "Username atau kata sandi tidak valid. Periksa kembali dan coba lagi.";

/**
 * Development fixtures only — NOT production credentials.
 * Passwords are never stored in the browser session payload.
 */
const DEV_FIXTURES: ReadonlyArray<{
  username: string;
  /** Development fixture secret — rotate/remove when BPS auth is connected. */
  password: string;
  user: AuthUser;
}> = [
  {
    username: "admin",
    password: "dev-admin-only",
    user: {
      id: "dev-admin-001",
      name: "Administrator BPS",
      username: "admin",
      role: ROLES.ADMIN,
    },
  },
  {
    username: "operator",
    password: "dev-operator-only",
    user: {
      id: "dev-operator-001",
      name: "Operator Data",
      username: "operator",
      role: ROLES.OPERATOR,
    },
  },
];

/** sessionStorage key — UI convenience only; not an authoritative security store. */
const DEV_SESSION_KEY = "bps-loteng.dev-auth-session.v1";

interface StoredDevSession {
  sessionId: string;
  user: AuthUser;
  expiresAt: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createSession(user: AuthUser): AuthSession {
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  return {
    authenticated: true,
    user,
    expiresAt,
    sessionId: `dev_${user.id}_${Date.now().toString(36)}`,
  };
}

function readStored(): AuthSessionState {
  try {
    const raw = window.sessionStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return { authenticated: false };
    const parsed = JSON.parse(raw) as StoredDevSession;
    if (!parsed?.user?.id || !parsed.sessionId || !parsed.expiresAt) {
      clearStored();
      return { authenticated: false };
    }
    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      clearStored();
      return { authenticated: false };
    }

    // Bind session to known development fixtures only.
    // Ignore client-tampered role/name in sessionStorage (privilege escalation defense).
    const fixture = DEV_FIXTURES.find((f) => f.user.id === parsed.user.id);
    if (!fixture) {
      clearStored();
      return { authenticated: false };
    }
    if (
      parsed.user.role !== fixture.user.role ||
      parsed.user.username !== fixture.user.username
    ) {
      clearStored();
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: { ...fixture.user },
      expiresAt: parsed.expiresAt,
      sessionId: parsed.sessionId,
    };
  } catch {
    clearStored();
    return { authenticated: false };
  }
}

function writeStored(session: AuthSession): void {
  const payload: StoredDevSession = {
    sessionId: session.sessionId,
    user: session.user,
    expiresAt: session.expiresAt ?? new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
  window.sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(payload));
}

function clearStored(): void {
  window.sessionStorage.removeItem(DEV_SESSION_KEY);
}

export const developmentMockAuthProvider: AuthProvider = {
  mode: "development-mock",

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    await delay(450);

    const username = credentials.username.trim().toLowerCase();
    const password = credentials.password;

    if (!username || !password) {
      return { success: false, error: GENERIC_AUTH_ERROR };
    }

    const match = DEV_FIXTURES.find(
      (f) => f.username === username && f.password === password
    );

    // Constant-time-ish path: always take the same failure message.
    if (!match) {
      return { success: false, error: GENERIC_AUTH_ERROR };
    }

    const session = createSession(match.user);
    writeStored(session);
    return { success: true, user: match.user, session };
  },

  async logout(): Promise<void> {
    await delay(120);
    clearStored();
  },

  async getSession(): Promise<AuthSessionState> {
    await delay(40);
    return readStored();
  },
};
