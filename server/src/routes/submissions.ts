import { ChangeStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { changeInclude, toChangeDto, writeAudit } from "../lib/audit.js";
import { routeParam } from "../lib/params.js";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  requireRole,
  type AuthedRequest,
} from "../middleware/auth.js";

export const submissionsRouter = Router();
export const observationsRouter = Router();

function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 6 }).format(n);
}

const draftSchema = z.object({
  indicatorId: z.string().min(1),
  period: z.string().trim().min(1),
  proposedValue: z.number().finite().nullable(),
  proposedDisplay: z.string().nullable().optional(),
  sourceNote: z.string().nullable().optional(),
  changeNote: z.string().nullable().optional(),
  changeId: z.string().nullable().optional(),
});

submissionsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const status = req.query.status as ChangeStatus | undefined;
  const indicatorId = req.query.indicatorId as string | undefined;
  const createdByUserId = req.query.createdByUserId as string | undefined;

  const where: {
    status?: ChangeStatus;
    indicatorId?: string;
    createdByUserId?: string;
  } = {};
  if (status) where.status = status;
  if (indicatorId) where.indicatorId = indicatorId;

  // Operators may only list their own submissions — ignore foreign createdByUserId.
  if (req.user!.role === Role.OPERATOR) {
    where.createdByUserId = req.user!.id;
  } else if (createdByUserId) {
    where.createdByUserId = createdByUserId;
  }

  const list = await prisma.dataChange.findMany({
    where,
    include: changeInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(list.map(toChangeDto));
});

submissionsRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const change = await prisma.dataChange.findUnique({
    where: { id: routeParam(req, "id") },
    include: changeInclude,
  });
  if (!change) {
    res.status(404).json({
      error: "NOT_FOUND",
      message: "Pengajuan tidak ditemukan.",
    });
    return;
  }
  if (
    req.user!.role === Role.OPERATOR &&
    change.createdByUserId !== req.user!.id
  ) {
    res.status(403).json({
      error: "FORBIDDEN",
      message: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
    });
    return;
  }
  res.json(toChangeDto(change));
});

submissionsRouter.post(
  "/drafts",
  requireAuth,
  requireRole(Role.ADMIN, Role.OPERATOR),
  async (req: AuthedRequest, res) => {
    const parsed = draftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: "VALIDATION",
        message: "Terdapat data yang belum valid.",
      });
      return;
    }

    const indicator = await prisma.indicator.findUnique({
      where: { id: parsed.data.indicatorId },
    });
    if (!indicator) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Indikator tidak ditemukan.",
      });
      return;
    }

    const obs = await prisma.observation.findUnique({
      where: {
        indicatorId_period: {
          indicatorId: parsed.data.indicatorId,
          period: parsed.data.period,
        },
      },
    });
    if (!obs) {
      res.status(422).json({
        error: "VALIDATION",
        message:
          "Periode tidak ada pada indikator ini. Label periode khusus tidak dinormalisasi.",
      });
      return;
    }

    const proposedValue = parsed.data.proposedValue;
    const proposedDisplay =
      parsed.data.proposedDisplay ??
      (proposedValue === null ? null : formatNumber(proposedValue));
    const sourceNote = parsed.data.sourceNote?.trim() || null;
    const changeNote = parsed.data.changeNote?.trim() || null;
    const valueChanged = proposedValue !== obs.value;

    if (valueChanged && !changeNote) {
      res.status(422).json({
        error: "VALIDATION",
        message:
          "Catatan pemutakhiran wajib diisi bila nilai usulan berbeda dari nilai saat ini.",
      });
      return;
    }
    if (valueChanged && !sourceNote) {
      res.status(422).json({
        error: "VALIDATION",
        message:
          "Sumber data wajib diisi bila nilai usulan berbeda dari nilai saat ini.",
      });
      return;
    }

    let existing = parsed.data.changeId
      ? await prisma.dataChange.findUnique({
          where: { id: parsed.data.changeId },
          include: changeInclude,
        })
      : await prisma.dataChange.findFirst({
          where: {
            indicatorId: parsed.data.indicatorId,
            period: parsed.data.period,
            createdByUserId: req.user!.id,
            status: { in: [ChangeStatus.DRAFT, ChangeStatus.REJECTED] },
          },
          include: changeInclude,
        });

    if (existing) {
      if (
        existing.createdByUserId !== req.user!.id &&
        req.user!.role !== Role.ADMIN
      ) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
        });
        return;
      }
      if (
        existing.status !== ChangeStatus.DRAFT &&
        existing.status !== ChangeStatus.REJECTED
      ) {
        res.status(409).json({
          error: "CONFLICT",
          message:
            "Pengajuan yang menunggu review atau sudah dipublikasikan tidak dapat diedit.",
        });
        return;
      }

      const prevStatus = existing.status;
      const updated = await prisma.dataChange.update({
        where: { id: existing.id },
        data: {
          proposedValue,
          proposedDisplay,
          sourceNote,
          changeNote,
          status: ChangeStatus.DRAFT,
          submittedAt: null,
          reviewedAt: null,
          reviewedByUserId: null,
          reviewNote: null,
          publishedAt: null,
          previousValue: obs.value,
          previousDisplay: obs.display,
          unit: indicator.unit,
        },
        include: changeInclude,
      });

      await writeAudit({
        userId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: "UPDATE_DRAFT",
        entityType: "DataChange",
        entityId: updated.id,
        indicatorId: updated.indicatorId,
        period: updated.period,
        previousValue: obs.value,
        newValue: proposedValue,
        previousStatus: prevStatus,
        newStatus: ChangeStatus.DRAFT,
        note: changeNote,
      });

      res.json(toChangeDto(updated));
      return;
    }

    const created = await prisma.dataChange.create({
      data: {
        indicatorId: indicator.id,
        period: parsed.data.period,
        previousValue: obs.value,
        previousDisplay: obs.display,
        proposedValue,
        proposedDisplay,
        unit: indicator.unit,
        sourceNote,
        changeNote,
        status: ChangeStatus.DRAFT,
        createdByUserId: req.user!.id,
      },
      include: changeInclude,
    });

    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "CREATE_DRAFT",
      entityType: "DataChange",
      entityId: created.id,
      indicatorId: created.indicatorId,
      period: created.period,
      previousValue: obs.value,
      newValue: proposedValue,
      previousStatus: null,
      newStatus: ChangeStatus.DRAFT,
      note: changeNote,
    });

    res.status(201).json(toChangeDto(created));
  }
);

submissionsRouter.post(
  "/:id/submit",
  requireAuth,
  requireRole(Role.ADMIN, Role.OPERATOR),
  async (req: AuthedRequest, res) => {
    const change = await prisma.dataChange.findUnique({
      where: { id: routeParam(req, "id") },
      include: changeInclude,
    });
    if (!change) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Pengajuan tidak ditemukan.",
      });
      return;
    }
    if (
      change.createdByUserId !== req.user!.id &&
      req.user!.role !== Role.ADMIN
    ) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
      });
      return;
    }
    if (
      change.status !== ChangeStatus.DRAFT &&
      change.status !== ChangeStatus.REJECTED
    ) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Hanya draft atau pengajuan ditolak yang dapat diajukan.",
      });
      return;
    }

    const otherPending = await prisma.dataChange.findFirst({
      where: {
        indicatorId: change.indicatorId,
        period: change.period,
        status: ChangeStatus.PENDING_REVIEW,
        id: { not: change.id },
      },
    });
    if (otherPending) {
      res.status(409).json({
        error: "CONFLICT",
        message:
          "Sudah ada pengajuan menunggu review untuk indikator dan periode yang sama. Tunggu keputusan Admin sebelum mengajukan ulang.",
      });
      return;
    }

    const prev = change.status;
    const updated = await prisma.dataChange.update({
      where: { id: change.id },
      data: {
        status: ChangeStatus.PENDING_REVIEW,
        submittedAt: new Date(),
      },
      include: changeInclude,
    });

    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "SUBMIT_FOR_REVIEW",
      entityType: "DataChange",
      entityId: updated.id,
      indicatorId: updated.indicatorId,
      period: updated.period,
      previousValue: updated.previousValue,
      newValue: updated.proposedValue,
      previousStatus: prev,
      newStatus: ChangeStatus.PENDING_REVIEW,
      note: updated.changeNote,
    });

    res.json(toChangeDto(updated));
  }
);

submissionsRouter.post(
  "/:id/reject",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const reason = String(req.body?.reviewNote ?? req.body?.reason ?? "").trim();
    if (!reason) {
      res.status(422).json({
        error: "VALIDATION",
        message: "Alasan penolakan wajib diisi.",
      });
      return;
    }
    const change = await prisma.dataChange.findUnique({
      where: { id: routeParam(req, "id") },
      include: changeInclude,
    });
    if (!change) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Pengajuan tidak ditemukan.",
      });
      return;
    }
    if (change.status !== ChangeStatus.PENDING_REVIEW) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Hanya pengajuan menunggu review yang dapat ditolak.",
      });
      return;
    }

    const updated = await prisma.dataChange.update({
      where: { id: change.id },
      data: {
        status: ChangeStatus.REJECTED,
        reviewNote: reason,
        reviewedAt: new Date(),
        reviewedByUserId: req.user!.id,
      },
      include: changeInclude,
    });

    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "REJECT",
      entityType: "DataChange",
      entityId: updated.id,
      indicatorId: updated.indicatorId,
      period: updated.period,
      previousValue: updated.previousValue,
      newValue: updated.proposedValue,
      previousStatus: ChangeStatus.PENDING_REVIEW,
      newStatus: ChangeStatus.REJECTED,
      note: reason,
    });

    res.json(toChangeDto(updated));
  }
);

submissionsRouter.post(
  "/:id/approve",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const change = await prisma.dataChange.findUnique({
      where: { id: routeParam(req, "id") },
      include: changeInclude,
    });
    if (!change) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Pengajuan tidak ditemukan.",
      });
      return;
    }
    if (change.status !== ChangeStatus.PENDING_REVIEW) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Hanya pengajuan menunggu review yang dapat disetujui.",
      });
      return;
    }

    const note = String(req.body?.reviewNote ?? "").trim() || null;
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.observation.upsert({
        where: {
          indicatorId_period: {
            indicatorId: change.indicatorId,
            period: change.period,
          },
        },
        update: {
          value: change.proposedValue,
          display: change.proposedDisplay,
        },
        create: {
          indicatorId: change.indicatorId,
          period: change.period,
          value: change.proposedValue,
          display: change.proposedDisplay,
        },
      });

      return tx.dataChange.update({
        where: { id: change.id },
        data: {
          status: ChangeStatus.PUBLISHED,
          reviewedAt: now,
          reviewedByUserId: req.user!.id,
          reviewNote: note,
          publishedAt: now,
        },
        include: changeInclude,
      });
    });

    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "APPROVE",
      entityType: "DataChange",
      entityId: updated.id,
      indicatorId: updated.indicatorId,
      period: updated.period,
      previousValue: updated.previousValue,
      newValue: updated.proposedValue,
      previousStatus: ChangeStatus.PENDING_REVIEW,
      newStatus: ChangeStatus.PUBLISHED,
      note,
    });
    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "PUBLISH",
      entityType: "DataChange",
      entityId: updated.id,
      indicatorId: updated.indicatorId,
      period: updated.period,
      previousValue: updated.previousValue,
      newValue: updated.proposedValue,
      previousStatus: ChangeStatus.PENDING_REVIEW,
      newStatus: ChangeStatus.PUBLISHED,
      note,
    });

    res.json(toChangeDto(updated));
  }
);

/** Publish alias — same as approve in this workflow. */
submissionsRouter.post(
  "/:id/publish",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const change = await prisma.dataChange.findUnique({
      where: { id: routeParam(req, "id") },
      include: changeInclude,
    });
    if (!change) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Pengajuan tidak ditemukan.",
      });
      return;
    }
    if (change.status === ChangeStatus.PUBLISHED) {
      res.json(toChangeDto(change));
      return;
    }
    if (change.status !== ChangeStatus.PENDING_REVIEW) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Hanya pengajuan menunggu review yang dapat dipublikasikan.",
      });
      return;
    }
    const note = String(req.body?.reviewNote ?? "").trim() || null;
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.observation.upsert({
        where: {
          indicatorId_period: {
            indicatorId: change.indicatorId,
            period: change.period,
          },
        },
        update: {
          value: change.proposedValue,
          display: change.proposedDisplay,
        },
        create: {
          indicatorId: change.indicatorId,
          period: change.period,
          value: change.proposedValue,
          display: change.proposedDisplay,
        },
      });
      return tx.dataChange.update({
        where: { id: change.id },
        data: {
          status: ChangeStatus.PUBLISHED,
          reviewedAt: now,
          reviewedByUserId: req.user!.id,
          reviewNote: note,
          publishedAt: now,
        },
        include: changeInclude,
      });
    });
    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "PUBLISH",
      entityType: "DataChange",
      entityId: updated.id,
      indicatorId: updated.indicatorId,
      period: updated.period,
      previousValue: updated.previousValue,
      newValue: updated.proposedValue,
      previousStatus: ChangeStatus.PENDING_REVIEW,
      newStatus: ChangeStatus.PUBLISHED,
      note,
    });
    res.json(toChangeDto(updated));
  }
);

submissionsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN, Role.OPERATOR),
  async (req: AuthedRequest, res) => {
    const change = await prisma.dataChange.findUnique({
      where: { id: routeParam(req, "id") },
    });
    if (!change) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Draft tidak ditemukan.",
      });
      return;
    }
    if (
      change.createdByUserId !== req.user!.id &&
      req.user!.role !== Role.ADMIN
    ) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
      });
      return;
    }
    if (change.status !== ChangeStatus.DRAFT) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Hanya draft yang belum diajukan yang dapat dihapus.",
      });
      return;
    }
    await prisma.dataChange.delete({ where: { id: change.id } });
    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "DELETE_DRAFT",
      entityType: "DataChange",
      entityId: change.id,
      indicatorId: change.indicatorId,
      period: change.period,
      previousValue: change.previousValue,
      newValue: change.proposedValue,
      previousStatus: ChangeStatus.DRAFT,
      newStatus: ChangeStatus.DRAFT,
      note: "Draft dihapus",
    });
    res.json({ ok: true });
  }
);

observationsRouter.put(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const parsed = z
      .object({
        value: z.number().finite().nullable(),
        display: z.string().nullable().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: "VALIDATION",
        message: "Terdapat data yang belum valid.",
      });
      return;
    }
    try {
      const prev = await prisma.observation.findUnique({
        where: { id: routeParam(req, "id") },
      });
      if (!prev) throw new Error("missing");
      const updated = await prisma.observation.update({
        where: { id: routeParam(req, "id") },
        data: {
          value: parsed.data.value,
          display: parsed.data.display ?? null,
        },
      });
      await writeAudit({
        userId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: "UPDATE",
        entityType: "Observation",
        entityId: updated.id,
        indicatorId: updated.indicatorId,
        period: updated.period,
        previousValue: prev.value,
        newValue: updated.value,
      });
      res.json(updated);
    } catch {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Observasi tidak ditemukan.",
      });
    }
  }
);

observationsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    try {
      const prev = await prisma.observation.findUnique({
        where: { id: routeParam(req, "id") },
      });
      if (!prev) throw new Error("missing");
      await prisma.observation.delete({ where: { id: routeParam(req, "id") } });
      await writeAudit({
        userId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: "DELETE",
        entityType: "Observation",
        entityId: prev.id,
        indicatorId: prev.indicatorId,
        period: prev.period,
        previousValue: prev.value,
      });
      res.json({ ok: true });
    } catch {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Observasi tidak ditemukan.",
      });
    }
  }
);
