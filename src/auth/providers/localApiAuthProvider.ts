/**
 * Auth against local full-stack API (HttpOnly cookie session).
 * Not BPS production SSO — local/staging backend only.
 */

import { apiRequest } from "../../lib/api";
import type {
  AuthCredentials,
  AuthProvider,
  AuthResult,
  AuthSessionState,
  AuthUser,
} from "../types";

interface MeResponse {
  user: AuthUser;
}

export const localApiAuthProvider: AuthProvider = {
  mode: "local-api",

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const data = await apiRequest<MeResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password,
        }),
      });
      return {
        success: true,
        user: data.user,
        session: {
          authenticated: true,
          user: data.user,
          expiresAt: null,
          sessionId: `api_${data.user.id}`,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Username atau kata sandi tidak valid. Periksa kembali dan coba lagi.";
      return { success: false, error: message };
    }
  },

  async logout(): Promise<void> {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // clear local state regardless
    }
  },

  async getSession(): Promise<AuthSessionState> {
    try {
      const data = await apiRequest<MeResponse>("/api/auth/me");
      return {
        authenticated: true,
        user: data.user,
        expiresAt: null,
        sessionId: `api_${data.user.id}`,
      };
    } catch {
      return { authenticated: false };
    }
  },
};
