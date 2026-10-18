/**
 * Auth provider selection.
 * Default: local-api when VITE_API_BASE_URL / VITE_AUTH_PROVIDER=api is set.
 * Falls back to development mock for offline UI demos.
 */

import { isApiMode } from "../../lib/api";
import type { AuthProvider } from "../types";
import { developmentMockAuthProvider } from "./devMockAuthProvider";
import { localApiAuthProvider } from "./localApiAuthProvider";

function selectAuthProvider(): AuthProvider {
  const explicit = import.meta.env.VITE_AUTH_PROVIDER as string | undefined;
  if (explicit === "mock") return developmentMockAuthProvider;
  if (explicit === "api" || explicit === "local-api" || isApiMode()) {
    return localApiAuthProvider;
  }
  return localApiAuthProvider;
}

export const authProvider: AuthProvider = selectAuthProvider();

export function getAuthProviderMode(): AuthProvider["mode"] {
  return authProvider.mode;
}
