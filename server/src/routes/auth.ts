import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../lib/audit.js";
import { verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import {
  clearSessionCookie,
  setSessionCookie,
  signSession,
} from "../lib/session.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../middleware/auth.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "VALIDATION",
      message: "Terdapat data yang belum valid.",
    });
    return;
  }

  const username = parsed.data.username.toLowerCase();
  const user = await prisma.user.findUnique({ where: { username } });
  const ok =
    user &&
    user.isActive &&
    (await verifyPassword(parsed.data.password, user.passwordHash));

  if (!ok || !user) {
    res.status(401).json({
      error: "INVALID_CREDENTIALS",
      message: "Username atau kata sandi tidak valid. Periksa kembali dan coba lagi.",
    });
    return;
  }

  const token = signSession({
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
  setSessionCookie(res, token);

  await writeAudit({
    userId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
});

authRouter.post("/logout", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user) {
    await writeAudit({
      userId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: "LOGOUT",
      entityType: "User",
      entityId: req.user.id,
    });
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  res.json({
    user: {
      id: req.user!.id,
      username: req.user!.username,
      name: req.user!.name,
      role: req.user!.role,
    },
  });
});
