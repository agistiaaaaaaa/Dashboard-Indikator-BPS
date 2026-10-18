import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../lib/audit.js";
import { routeParam } from "../lib/params.js";
import { prisma } from "../lib/prisma.js";
import {
  optionalAuth,
  requireAuth,
  requireRole,
  type AuthedRequest,
} from "../middleware/auth.js";

export const indicatorsRouter = Router();

function mapIndicator(
  ind: {
    id: string;
    name: string;
    category: string;
    unit: string | null;
    description: string | null;
    source: string;
    observations: {
      period: string;
      value: number | null;
      display: string | null;
    }[];
  }
) {
  return {
    id: ind.id,
    name: ind.name,
    category: ind.category,
    unit: ind.unit,
    description: ind.description,
    source: ind.source,
    values: ind.observations.map((o) => ({
      period: o.period,
      value: o.value,
      display: o.display,
      status: o.value === null ? "unavailable" : "available",
    })),
  };
}

indicatorsRouter.get("/", optionalAuth, async (_req, res) => {
  const indicators = await prisma.indicator.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { observations: { orderBy: { period: "asc" } } },
  });
  const categories = [...new Set(indicators.map((i) => i.category))];
  res.json({
    meta: {
      title: "Indikator Strategis Lombok Tengah",
      provider: "BPS Kabupaten Lombok Tengah",
      source: "database",
    },
    categories,
    indicators: indicators.map(mapIndicator),
    highlights: [],
  });
});

indicatorsRouter.get("/:id", optionalAuth, async (req, res) => {
  const ind = await prisma.indicator.findUnique({
    where: { id: routeParam(req, "id") },
    include: { observations: { orderBy: { period: "asc" } } },
  });
  if (!ind) {
    res.status(404).json({
      error: "NOT_FOUND",
      message: "Indikator tidak ditemukan.",
    });
    return;
  }
  res.json(mapIndicator(ind));
});

const indicatorBody = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  unit: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  source: z.string().trim().min(1),
});

indicatorsRouter.post(
  "/",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const parsed = indicatorBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: "VALIDATION",
        message: "Terdapat data yang belum valid.",
      });
      return;
    }
    const id =
      parsed.data.id ??
      parsed.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64);

    const existing = await prisma.indicator.findUnique({ where: { id } });
    if (existing) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Indikator dengan ID tersebut sudah ada.",
      });
      return;
    }

    const created = await prisma.indicator.create({
      data: {
        id,
        name: parsed.data.name,
        category: parsed.data.category,
        unit: parsed.data.unit ?? null,
        description: parsed.data.description ?? null,
        source: parsed.data.source,
      },
      include: { observations: true },
    });

    await writeAudit({
      userId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: "CREATE",
      entityType: "Indicator",
      entityId: created.id,
      note: created.name,
    });

    res.status(201).json(mapIndicator(created));
  }
);

indicatorsRouter.put(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const parsed = indicatorBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: "VALIDATION",
        message: "Terdapat data yang belum valid.",
      });
      return;
    }
    try {
      const updated = await prisma.indicator.update({
        where: { id: routeParam(req, "id") },
        data: {
          name: parsed.data.name,
          category: parsed.data.category,
          unit: parsed.data.unit ?? null,
          description: parsed.data.description ?? null,
          source: parsed.data.source,
        },
        include: { observations: { orderBy: { period: "asc" } } },
      });
      await writeAudit({
        userId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: "UPDATE",
        entityType: "Indicator",
        entityId: updated.id,
        note: updated.name,
      });
      res.json(mapIndicator(updated));
    } catch {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Indikator tidak ditemukan.",
      });
    }
  }
);

indicatorsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const pending = await prisma.dataChange.count({
      where: {
        indicatorId: routeParam(req, "id"),
        status: { in: ["DRAFT", "PENDING_REVIEW", "REJECTED"] },
      },
    });
    if (pending > 0) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Tidak dapat menghapus indikator yang masih punya pengajuan aktif.",
      });
      return;
    }
    try {
      await prisma.indicator.delete({ where: { id: routeParam(req, "id") } });
      await writeAudit({
        userId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: "DELETE",
        entityType: "Indicator",
        entityId: routeParam(req, "id"),
      });
      res.json({ ok: true });
    } catch {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Indikator tidak ditemukan.",
      });
    }
  }
);

const observationBody = z.object({
  period: z.string().trim().min(1),
  value: z.number().finite().nullable(),
  display: z.string().trim().nullable().optional(),
});

indicatorsRouter.get("/:id/observations", optionalAuth, async (req, res) => {
  const list = await prisma.observation.findMany({
    where: { indicatorId: routeParam(req, "id") },
    orderBy: { period: "asc" },
  });
  res.json(list);
});

indicatorsRouter.post(
  "/:id/observations",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req: AuthedRequest, res) => {
    const parsed = observationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: "VALIDATION",
        message: "Terdapat data yang belum valid.",
      });
      return;
    }
    const ind = await prisma.indicator.findUnique({
      where: { id: routeParam(req, "id") },
    });
    if (!ind) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "Indikator tidak ditemukan.",
      });
      return;
    }
    try {
      const obs = await prisma.observation.create({
        data: {
          indicatorId: ind.id,
          period: parsed.data.period,
          value: parsed.data.value,
          display: parsed.data.display ?? null,
        },
      });
      await writeAudit({
        userId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: "CREATE",
        entityType: "Observation",
        entityId: obs.id,
        indicatorId: ind.id,
        period: obs.period,
        newValue: obs.value,
      });
      res.status(201).json(obs);
    } catch {
      res.status(409).json({
        error: "CONFLICT",
        message: "Observasi untuk periode tersebut sudah ada.",
      });
    }
  }
);
