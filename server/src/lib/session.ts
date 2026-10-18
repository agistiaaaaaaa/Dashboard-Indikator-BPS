import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

const COOKIE_NAME = "bps_loteng_session";

export interface SessionPayload {
  sub: string;
  username: string;
  name: string;
  role: Role;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars).");
  }
  return s;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: "8h" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, secret()) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function readSessionToken(req: Request): string | null {
  const raw = req.cookies?.[COOKIE_NAME];
  return typeof raw === "string" && raw ? raw : null;
}

export { COOKIE_NAME };
