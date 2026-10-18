import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  readSessionToken,
  verifySession,
  type SessionPayload,
} from "../lib/session.js";

export interface AuthedRequest extends Request {
  user?: SessionPayload & { id: string };
}

export async function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = readSessionToken(req);
  if (!token) {
    next();
    return;
  }
  const payload = verifySession(token);
  if (!payload) {
    next();
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    next();
    return;
  }
  req.user = {
    id: user.id,
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
  next();
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Session Anda telah berakhir. Silakan login kembali.",
      });
      return;
    }
    next();
  });
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Session Anda telah berakhir. Silakan login kembali.",
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
      });
      return;
    }
    next();
  };
}
