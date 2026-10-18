/**
 * Data-management domain types for the future Draft → Review → Publish workflow.
 *
 * These types prepare the frontend seam. They do NOT invent a BPS backend,
 * database, or persistence layer.
 *
 * Development dataset (`src/data/indicators.json`) remains read-only verified
 * development data — never mutate it from the browser as a fake database.
 */

/** Explicit lifecycle for indicator data changes. */
export const DATA_CHANGE_STATUSES = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
} as const;

export type DataChangeStatus =
  (typeof DATA_CHANGE_STATUSES)[keyof typeof DATA_CHANGE_STATUSES];

export const DATA_CHANGE_STATUS_LABELS: Record<DataChangeStatus, string> = {
  [DATA_CHANGE_STATUSES.DRAFT]: "Draft",
  [DATA_CHANGE_STATUSES.PENDING_REVIEW]: "Menunggu review",
  [DATA_CHANGE_STATUSES.PUBLISHED]: "Dipublikasikan",
  [DATA_CHANGE_STATUSES.REJECTED]: "Ditolak",
};

/**
 * A proposed change to a single indicator value for a period.
 * Created by Operator (or Admin); published only after authorized approval.
 */
export interface IndicatorValueChange {
  id: string;
  indicatorId: string;
  indicatorName: string;
  period: string;
  /** Previous published/current value; null means previously unavailable. */
  previousValue: number | null;
  previousDisplay: string | null;
  /** Proposed value; null is allowed and must remain null (never coerced to 0). */
  proposedValue: number | null;
  proposedDisplay: string | null;
  unit: string | null;
  sourceNote: string | null;
  changeNote: string | null;
  status: DataChangeStatus;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  submittedAt: string | null;
  reviewedByUserId: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  publishedAt: string | null;
}

/** Auditable record of an authorized change action. */
export interface DataChangeAuditEntry {
  id: string;
  changeId: string;
  indicatorId: string;
  period: string;
  action:
    | "CREATE_DRAFT"
    | "UPDATE_DRAFT"
    | "SUBMIT"
    | "SUBMIT_FOR_REVIEW"
    | "DELETE_DRAFT"
    | "APPROVE"
    | "REJECT"
    | "PUBLISH";
  actorUserId: string;
  actorName: string;
  actorRole: "ADMIN" | "OPERATOR";
  previousValue: number | null;
  newValue: number | null;
  previousStatus: DataChangeStatus | null;
  newStatus: DataChangeStatus;
  note: string | null;
  occurredAt: string;
}

/** Input for saving a draft value update (Pemutakhiran Data UX). */
export interface SaveDraftValueInput {
  indicatorId: string;
  period: string;
  proposedValue: number | null;
  proposedDisplay?: string | null;
  sourceNote?: string | null;
  changeNote?: string | null;
  /** Optional: update existing draft by id */
  changeId?: string | null;
}

export interface SubmitChangeInput {
  changeId: string;
  note?: string | null;
}

export interface ReviewChangeInput {
  changeId: string;
  decision: "APPROVE" | "REJECT";
  reviewNote?: string | null;
}

export interface PublishChangeInput {
  changeId: string;
  note?: string | null;
}

export interface DeleteDraftInput {
  changeId: string;
}

export interface DataManagementActor {
  userId: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
}

/**
 * Provider contract for future BPS data-management backend.
 * Implementations must NOT mutate `indicators.json` in the browser.
 */
export interface DataManagementProvider {
  readonly mode: "development-stub" | "development-store" | "local-api" | "bps";
  listChanges(filter?: {
    status?: DataChangeStatus;
    indicatorId?: string;
    createdByUserId?: string;
  }): Promise<IndicatorValueChange[]>;
  getChange(id: string): Promise<IndicatorValueChange | null>;
  saveDraft(input: SaveDraftValueInput, actor: DataManagementActor): Promise<IndicatorValueChange>;
  submitForReview(input: SubmitChangeInput, actor: DataManagementActor): Promise<IndicatorValueChange>;
  reviewChange(input: ReviewChangeInput, actor: DataManagementActor): Promise<IndicatorValueChange>;
  publishChange(input: PublishChangeInput, actor: DataManagementActor): Promise<IndicatorValueChange>;
  deleteDraft(input: DeleteDraftInput, actor: DataManagementActor): Promise<void>;
  listAudit(changeId?: string): Promise<DataChangeAuditEntry[]>;
}

export const DATA_WORKFLOW_STEPS = [
  "Operator membuat/mengedit draft",
  "Operator mengajukan review",
  "Admin meninjau (setujui atau tolak)",
  "Admin mempublikasikan data yang disetujui",
  "Dashboard publik menampilkan data PUBLISHED saja",
] as const;
