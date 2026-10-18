/**
 * Centralized API client for the local full-stack backend.
 * credentials: include — HttpOnly session cookie.
 */

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Dispatched when an authenticated API call returns 401 (session expired). */
export const SESSION_EXPIRED_EVENT = "bps-loteng:session-expired";

function baseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (raw ?? "http://localhost:4000").replace(/\/$/, "");
}

export function isApiMode(): boolean {
  const mode = (import.meta.env.VITE_DATA_PROVIDER as string | undefined) ?? "api";
  return mode === "api" || mode === "bps";
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!res.ok) {
    const err = body as { error?: string; message?: string } | null;
    const message =
      err?.message ||
      (res.status === 401
        ? "Session Anda telah berakhir. Silakan login kembali."
        : res.status === 403
          ? "Anda tidak memiliki izin untuk melakukan tindakan ini."
          : res.status === 422
            ? "Terdapat data yang belum valid."
            : "Terjadi kesalahan pada server.");

    const isAuthProbe =
      path.startsWith("/api/auth/login") || path.startsWith("/api/auth/me");
    if (res.status === 401 && !isAuthProbe && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    throw new ApiError(res.status, err?.error ?? "ERROR", message);
  }

  return body as T;
}
