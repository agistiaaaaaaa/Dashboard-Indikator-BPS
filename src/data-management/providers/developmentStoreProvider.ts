/**
 * ============================================================================
 * DEVELOPMENT-ONLY data-management store
 * ============================================================================
 * Persists draft → review → publish workflow in sessionStorage.
 * Does NOT mutate src/data/indicators.json.
 * Does NOT replace an official BPS backend.
 * ============================================================================
 */

import { getIndicatorById } from "../../data/indicators";
import { formatNumber } from "../../utils/format";
import { resolveDisplayUnit } from "../../utils/presentation";
import { getValueAtPeriod } from "../../utils/trend";
import { notifyDataStoreChanged } from "../storeEvents";
import {
  DATA_CHANGE_STATUSES,
  type DataChangeAuditEntry,
  type DataManagementActor,
  type DataManagementProvider,
  type DeleteDraftInput,
  type IndicatorValueChange,
  type PublishChangeInput,
  type ReviewChangeInput,
  type SaveDraftValueInput,
  type SubmitChangeInput,
} from "../types";

const STORE_KEY = "bps-loteng.dev-data-mgmt.v1";

interface StoreShape {
  changes: IndicatorValueChange[];
  audits: DataChangeAuditEntry[];
}

function emptyStore(): StoreShape {
  return { changes: [], audits: [] };
}

function readStore(): StoreShape {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as StoreShape;
    if (!Array.isArray(parsed.changes) || !Array.isArray(parsed.audits)) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreShape): void {
  window.sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  notifyDataStoreChanged();
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function displayFor(value: number | null, explicit?: string | null): string | null {
  if (explicit != null && explicit !== "") return explicit;
  if (value === null) return null;
  return formatNumber(value);
}

function pushAudit(
  store: StoreShape,
  entry: Omit<DataChangeAuditEntry, "id" | "occurredAt"> & { occurredAt?: string }
): void {
  store.audits.unshift({
    ...entry,
    id: newId("aud"),
    occurredAt: entry.occurredAt ?? nowIso(),
  });
}

function findEditableDraft(
  store: StoreShape,
  indicatorId: string,
  period: string,
  userId: string
): IndicatorValueChange | undefined {
  return store.changes.find(
    (c) =>
      c.indicatorId === indicatorId &&
      c.period === period &&
      c.createdByUserId === userId &&
      (c.status === DATA_CHANGE_STATUSES.DRAFT || c.status === DATA_CHANGE_STATUSES.REJECTED)
  );
}

function assertFiniteOrNull(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) {
    throw new Error("Nilai usulan tidak valid (bukan angka).");
  }
  return value;
}

export const developmentStoreDataManagementProvider: DataManagementProvider = {
  mode: "development-store",

  async listChanges(filter) {
    let list = readStore().changes;
    if (filter?.status) list = list.filter((c) => c.status === filter.status);
    if (filter?.indicatorId) list = list.filter((c) => c.indicatorId === filter.indicatorId);
    if (filter?.createdByUserId) {
      list = list.filter((c) => c.createdByUserId === filter.createdByUserId);
    }
    return list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getChange(id) {
    return readStore().changes.find((c) => c.id === id) ?? null;
  },

  async saveDraft(input: SaveDraftValueInput, actor: DataManagementActor) {
    const indicator = getIndicatorById(input.indicatorId);
    if (!indicator) {
      throw new Error("Indikator tidak ditemukan pada dataset terverifikasi.");
    }
    const period = input.period.trim();
    if (!period) {
      throw new Error("Periode wajib diisi.");
    }

    const knownPeriods = new Set(indicator.values.map((v) => v.period));
    if (!knownPeriods.has(period)) {
      throw new Error(
        "Periode tidak ada pada indikator ini. Label periode khusus tidak dinormalisasi."
      );
    }

    const proposedValue = assertFiniteOrNull(input.proposedValue);
    const proposedDisplay = displayFor(proposedValue, input.proposedDisplay);

    const current = getValueAtPeriod(indicator, period);
    // "Current" for comparison = public read model (base + PUBLISHED overlay only).
    const publishedOverlay = listPublishedOverridesSync().find(
      (c) => c.indicatorId === input.indicatorId && c.period === period
    );
    const previousValue =
      publishedOverlay?.proposedValue !== undefined
        ? publishedOverlay.proposedValue
        : (current?.value ?? null);
    const previousDisplay =
      publishedOverlay?.proposedDisplay ??
      current?.display ??
      (previousValue === null ? null : formatNumber(previousValue));

    const sourceNote = input.sourceNote?.trim() || null;
    const changeNote = input.changeNote?.trim() || null;
    const valueChanged = proposedValue !== previousValue;

    if (valueChanged && !changeNote) {
      throw new Error(
        "Catatan pemutakhiran wajib diisi bila nilai usulan berbeda dari nilai saat ini."
      );
    }
    if (valueChanged && !sourceNote) {
      throw new Error(
        "Sumber data wajib diisi bila nilai usulan berbeda dari nilai saat ini."
      );
    }

    const store = readStore();
    const existing =
      (input.changeId
        ? store.changes.find((c) => c.id === input.changeId)
        : undefined) ?? findEditableDraft(store, input.indicatorId, period, actor.userId);

    if (existing) {
      if (existing.createdByUserId !== actor.userId && actor.role !== "ADMIN") {
        throw new Error("Anda tidak dapat mengubah draft milik pengguna lain.");
      }
      if (
        existing.status !== DATA_CHANGE_STATUSES.DRAFT &&
        existing.status !== DATA_CHANGE_STATUSES.REJECTED
      ) {
        throw new Error(
          "Pengajuan yang menunggu review atau sudah dipublikasikan tidak dapat diedit."
        );
      }

      const prevStatus = existing.status;
      existing.proposedValue = proposedValue;
      existing.proposedDisplay = proposedDisplay;
      existing.sourceNote = sourceNote;
      existing.changeNote = changeNote;
      existing.status = DATA_CHANGE_STATUSES.DRAFT;
      existing.reviewedAt = null;
      existing.reviewedByUserId = null;
      existing.reviewedByName = null;
      existing.reviewNote = null;
      existing.publishedAt = null;
      existing.submittedAt = null;

      pushAudit(store, {
        changeId: existing.id,
        indicatorId: existing.indicatorId,
        period: existing.period,
        action: "UPDATE_DRAFT",
        actorUserId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        previousValue: existing.previousValue,
        newValue: proposedValue,
        previousStatus: prevStatus,
        newStatus: DATA_CHANGE_STATUSES.DRAFT,
        note: existing.changeNote,
      });

      writeStore(store);
      return { ...existing };
    }

    const change: IndicatorValueChange = {
      id: newId("chg"),
      indicatorId: indicator.id,
      indicatorName: indicator.name,
      period,
      previousValue,
      previousDisplay,
      proposedValue,
      proposedDisplay,
      unit: resolveDisplayUnit(indicator) ?? indicator.unit,
      sourceNote,
      changeNote,
      status: DATA_CHANGE_STATUSES.DRAFT,
      createdByUserId: actor.userId,
      createdByName: actor.name,
      createdAt: nowIso(),
      submittedAt: null,
      reviewedByUserId: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewNote: null,
      publishedAt: null,
    };

    store.changes.unshift(change);
    pushAudit(store, {
      changeId: change.id,
      indicatorId: change.indicatorId,
      period: change.period,
      action: "CREATE_DRAFT",
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      previousValue,
      newValue: proposedValue,
      previousStatus: null,
      newStatus: DATA_CHANGE_STATUSES.DRAFT,
      note: change.changeNote,
    });
    writeStore(store);
    return { ...change };
  },

  async submitForReview(input: SubmitChangeInput, actor: DataManagementActor) {
    const store = readStore();
    const change = store.changes.find((c) => c.id === input.changeId);
    if (!change) throw new Error("Pengajuan tidak ditemukan.");
    if (change.createdByUserId !== actor.userId && actor.role !== "ADMIN") {
      throw new Error("Anda hanya dapat mengajukan draft milik sendiri.");
    }
    if (
      change.status !== DATA_CHANGE_STATUSES.DRAFT &&
      change.status !== DATA_CHANGE_STATUSES.REJECTED
    ) {
      throw new Error("Hanya draft atau pengajuan ditolak yang dapat diajukan.");
    }

    const prev = change.status;
    change.status = DATA_CHANGE_STATUSES.PENDING_REVIEW;
    change.submittedAt = nowIso();
    if (input.note?.trim()) change.changeNote = input.note.trim();

    pushAudit(store, {
      changeId: change.id,
      indicatorId: change.indicatorId,
      period: change.period,
      action: "SUBMIT_FOR_REVIEW",
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      previousValue: change.previousValue,
      newValue: change.proposedValue,
      previousStatus: prev,
      newStatus: DATA_CHANGE_STATUSES.PENDING_REVIEW,
      note: input.note?.trim() || change.changeNote,
    });
    writeStore(store);
    return { ...change };
  },

  async reviewChange(input: ReviewChangeInput, actor: DataManagementActor) {
    if (actor.role !== "ADMIN") {
      throw new Error("Hanya Administrator yang dapat meninjau pengajuan.");
    }
    const store = readStore();
    const change = store.changes.find((c) => c.id === input.changeId);
    if (!change) throw new Error("Pengajuan tidak ditemukan.");
    if (change.status !== DATA_CHANGE_STATUSES.PENDING_REVIEW) {
      throw new Error("Hanya pengajuan berstatus menunggu review yang dapat ditinjau.");
    }

    const prev = change.status;
    change.reviewedAt = nowIso();
    change.reviewedByUserId = actor.userId;
    change.reviewedByName = actor.name;
    change.reviewNote = input.reviewNote?.trim() || null;

    if (input.decision === "REJECT") {
      if (!change.reviewNote) {
        throw new Error("Alasan penolakan wajib diisi.");
      }
      change.status = DATA_CHANGE_STATUSES.REJECTED;
      pushAudit(store, {
        changeId: change.id,
        indicatorId: change.indicatorId,
        period: change.period,
        action: "REJECT",
        actorUserId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        previousValue: change.previousValue,
        newValue: change.proposedValue,
        previousStatus: prev,
        newStatus: DATA_CHANGE_STATUSES.REJECTED,
        note: change.reviewNote,
      });
      writeStore(store);
      return { ...change };
    }

    change.status = DATA_CHANGE_STATUSES.PUBLISHED;
    change.publishedAt = nowIso();
    pushAudit(store, {
      changeId: change.id,
      indicatorId: change.indicatorId,
      period: change.period,
      action: "APPROVE",
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      previousValue: change.previousValue,
      newValue: change.proposedValue,
      previousStatus: prev,
      newStatus: DATA_CHANGE_STATUSES.PUBLISHED,
      note: change.reviewNote,
    });
    pushAudit(store, {
      changeId: change.id,
      indicatorId: change.indicatorId,
      period: change.period,
      action: "PUBLISH",
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      previousValue: change.previousValue,
      newValue: change.proposedValue,
      previousStatus: prev,
      newStatus: DATA_CHANGE_STATUSES.PUBLISHED,
      note: change.reviewNote,
    });
    writeStore(store);
    return { ...change };
  },

  async publishChange(input: PublishChangeInput, actor: DataManagementActor) {
    return developmentStoreDataManagementProvider.reviewChange(
      { changeId: input.changeId, decision: "APPROVE", reviewNote: input.note },
      actor
    );
  },

  async deleteDraft(input: DeleteDraftInput, actor: DataManagementActor) {
    const store = readStore();
    const idx = store.changes.findIndex((c) => c.id === input.changeId);
    if (idx < 0) throw new Error("Draft tidak ditemukan.");
    const change = store.changes[idx];
    if (change.createdByUserId !== actor.userId && actor.role !== "ADMIN") {
      throw new Error("Anda hanya dapat menghapus draft milik sendiri.");
    }
    if (change.status !== DATA_CHANGE_STATUSES.DRAFT) {
      throw new Error("Hanya draft yang belum diajukan yang dapat dihapus.");
    }

    pushAudit(store, {
      changeId: change.id,
      indicatorId: change.indicatorId,
      period: change.period,
      action: "DELETE_DRAFT",
      actorUserId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      previousValue: change.previousValue,
      newValue: change.proposedValue,
      previousStatus: change.status,
      newStatus: change.status,
      note: "Draft dihapus",
    });
    store.changes.splice(idx, 1);
    writeStore(store);
  },

  async listAudit(changeId) {
    const audits = readStore().audits;
    if (!changeId) return audits.slice();
    return audits.filter((a) => a.changeId === changeId);
  },
};

/** Sync helpers for published overlay (same session store). Only PUBLISHED. */
export function listPublishedOverridesSync(): IndicatorValueChange[] {
  return readStore().changes.filter((c) => c.status === DATA_CHANGE_STATUSES.PUBLISHED);
}

export function clearDevelopmentDataStore(): void {
  window.sessionStorage.removeItem(STORE_KEY);
  notifyDataStoreChanged();
}
