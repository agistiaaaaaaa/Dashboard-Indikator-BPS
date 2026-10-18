/**
 * Data-management service seam.
 * UI should call these helpers — never mutate indicators.json from the client.
 */

import { dataManagementProvider } from "./providers";
import type {
  DataChangeAuditEntry,
  DataChangeStatus,
  DataManagementActor,
  DeleteDraftInput,
  IndicatorValueChange,
  PublishChangeInput,
  ReviewChangeInput,
  SaveDraftValueInput,
  SubmitChangeInput,
} from "./types";

export type {
  DataChangeAuditEntry,
  DataChangeStatus,
  DataManagementActor,
  DeleteDraftInput,
  IndicatorValueChange,
  PublishChangeInput,
  ReviewChangeInput,
  SaveDraftValueInput,
  SubmitChangeInput,
} from "./types";

export {
  DATA_CHANGE_STATUSES,
  DATA_CHANGE_STATUS_LABELS,
  DATA_WORKFLOW_STEPS,
} from "./types";

export {
  applyPublishedOverlay,
  applyPublishedOverlayToIndicator,
  getPublishedOverrides,
} from "./publishedOverlay";

export {
  computeValueDelta,
  formatValueDelta,
  parseOptionalNumber,
  validateDraftInput,
} from "./validation";

export { DATA_STORE_CHANGED_EVENT, notifyDataStoreChanged } from "./storeEvents";

export async function listDataChanges(filter?: {
  status?: DataChangeStatus;
  indicatorId?: string;
  createdByUserId?: string;
}): Promise<IndicatorValueChange[]> {
  return dataManagementProvider.listChanges(filter);
}

export async function getDataChange(id: string): Promise<IndicatorValueChange | null> {
  return dataManagementProvider.getChange(id);
}

export async function saveDraftChange(
  input: SaveDraftValueInput,
  actor: DataManagementActor
): Promise<IndicatorValueChange> {
  return dataManagementProvider.saveDraft(input, actor);
}

export async function submitChangeForReview(
  input: SubmitChangeInput,
  actor: DataManagementActor
): Promise<IndicatorValueChange> {
  return dataManagementProvider.submitForReview(input, actor);
}

export async function reviewDataChange(
  input: ReviewChangeInput,
  actor: DataManagementActor
): Promise<IndicatorValueChange> {
  return dataManagementProvider.reviewChange(input, actor);
}

export async function publishDataChange(
  input: PublishChangeInput,
  actor: DataManagementActor
): Promise<IndicatorValueChange> {
  return dataManagementProvider.publishChange(input, actor);
}

export async function deleteDraftChange(
  input: DeleteDraftInput,
  actor: DataManagementActor
): Promise<void> {
  return dataManagementProvider.deleteDraft(input, actor);
}

export async function listDataAudit(changeId?: string): Promise<DataChangeAuditEntry[]> {
  return dataManagementProvider.listAudit(changeId);
}

export function getDataManagementMode(): DataManagementProviderMode {
  return dataManagementProvider.mode;
}

export type DataManagementProviderMode =
  | "development-stub"
  | "development-store"
  | "local-api"
  | "bps";

export function isDataManagementConnected(): boolean {
  return (
    dataManagementProvider.mode === "bps" ||
    dataManagementProvider.mode === "local-api"
  );
}

export function isDevelopmentDataStore(): boolean {
  return dataManagementProvider.mode === "development-store";
}

export function isLocalApiDataMode(): boolean {
  return dataManagementProvider.mode === "local-api";
}
