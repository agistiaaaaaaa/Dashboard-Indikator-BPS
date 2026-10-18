import type { ChangeStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

export async function writeAudit(entry: {
  userId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  indicatorId?: string | null;
  period?: string | null;
  previousValue?: number | null;
  newValue?: number | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  note?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      indicatorId: entry.indicatorId ?? null,
      period: entry.period ?? null,
      previousValue: entry.previousValue ?? null,
      newValue: entry.newValue ?? null,
      previousStatus: entry.previousStatus ?? null,
      newStatus: entry.newStatus ?? null,
      note: entry.note ?? null,
    },
  });
}

export function toChangeDto(c: {
  id: string;
  indicatorId: string;
  period: string;
  previousValue: number | null;
  previousDisplay: string | null;
  proposedValue: number | null;
  proposedDisplay: string | null;
  unit: string | null;
  sourceNote: string | null;
  changeNote: string | null;
  status: ChangeStatus;
  createdByUserId: string;
  submittedAt: Date | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  indicator?: { name: string } | null;
  createdBy?: { name: string } | null;
  reviewedBy?: { name: string } | null;
}) {
  return {
    id: c.id,
    indicatorId: c.indicatorId,
    indicatorName: c.indicator?.name ?? c.indicatorId,
    period: c.period,
    previousValue: c.previousValue,
    previousDisplay: c.previousDisplay,
    proposedValue: c.proposedValue,
    proposedDisplay: c.proposedDisplay,
    unit: c.unit,
    sourceNote: c.sourceNote,
    changeNote: c.changeNote,
    status: c.status,
    createdByUserId: c.createdByUserId,
    createdByName: c.createdBy?.name ?? "",
    createdAt: c.createdAt.toISOString(),
    submittedAt: c.submittedAt?.toISOString() ?? null,
    reviewedByUserId: c.reviewedByUserId,
    reviewedByName: c.reviewedBy?.name ?? null,
    reviewedAt: c.reviewedAt?.toISOString() ?? null,
    reviewNote: c.reviewNote,
    publishedAt: c.publishedAt?.toISOString() ?? null,
  };
}

export const changeInclude = {
  indicator: { select: { name: true } },
  createdBy: { select: { name: true } },
  reviewedBy: { select: { name: true } },
} satisfies Prisma.DataChangeInclude;
