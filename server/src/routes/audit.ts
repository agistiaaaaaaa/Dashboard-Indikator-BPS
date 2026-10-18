import { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const auditRouter = Router();

auditRouter.get(
  "/",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req, res) => {
    const changeId = req.query.changeId as string | undefined;
    const action = req.query.action as string | undefined;
    const where: { entityId?: string; action?: string } = {};
    if (changeId) where.entityId = changeId;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    res.json(
      logs.map((a) => ({
        id: a.id,
        changeId: a.entityId,
        indicatorId: a.indicatorId ?? "",
        period: a.period ?? "",
        action: a.action,
        actorUserId: a.userId ?? "",
        actorName: a.actorName,
        actorRole: a.actorRole,
        previousValue: a.previousValue,
        newValue: a.newValue,
        previousStatus: a.previousStatus,
        newStatus: a.newStatus,
        note: a.note,
        occurredAt: a.createdAt.toISOString(),
      }))
    );
  }
);
