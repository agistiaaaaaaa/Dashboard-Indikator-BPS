/**
 * Data-management provider backed by local Express API + database.
 */

import { hydrateIndicatorCache } from "../../data/providers/apiCache";
import { apiRequest } from "../../lib/api";
import { notifyDataStoreChanged } from "../storeEvents";
import type {
  DataChangeAuditEntry,
  DataManagementActor,
  DataManagementProvider,
  DeleteDraftInput,
  IndicatorValueChange,
  PublishChangeInput,
  ReviewChangeInput,
  SaveDraftValueInput,
  SubmitChangeInput,
} from "../types";

async function afterPublishMutation<T>(result: T): Promise<T> {
  try {
    await hydrateIndicatorCache();
  } catch {
    // best-effort
  }
  notifyDataStoreChanged();
  return result;
}

export const localApiDataManagementProvider: DataManagementProvider = {
  mode: "local-api",

  async listChanges(filter) {
    const params = new URLSearchParams();
    if (filter?.status) params.set("status", filter.status);
    if (filter?.indicatorId) params.set("indicatorId", filter.indicatorId);
    if (filter?.createdByUserId) {
      params.set("createdByUserId", filter.createdByUserId);
    }
    const q = params.toString();
    return apiRequest<IndicatorValueChange[]>(
      `/api/submissions${q ? `?${q}` : ""}`
    );
  },

  async getChange(id) {
    try {
      return await apiRequest<IndicatorValueChange>(`/api/submissions/${id}`);
    } catch {
      return null;
    }
  },

  async saveDraft(input: SaveDraftValueInput, _actor: DataManagementActor) {
    const result = await apiRequest<IndicatorValueChange>(
      "/api/submissions/drafts",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    notifyDataStoreChanged();
    return result;
  },

  async submitForReview(input: SubmitChangeInput, _actor: DataManagementActor) {
    const result = await apiRequest<IndicatorValueChange>(
      `/api/submissions/${input.changeId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ note: input.note ?? null }),
      }
    );
    notifyDataStoreChanged();
    return result;
  },

  async reviewChange(input: ReviewChangeInput, _actor: DataManagementActor) {
    const path =
      input.decision === "REJECT"
        ? `/api/submissions/${input.changeId}/reject`
        : `/api/submissions/${input.changeId}/approve`;
    const result = await apiRequest<IndicatorValueChange>(path, {
      method: "POST",
      body: JSON.stringify({ reviewNote: input.reviewNote ?? null }),
    });
    return afterPublishMutation(result);
  },

  async publishChange(input: PublishChangeInput, _actor: DataManagementActor) {
    const result = await apiRequest<IndicatorValueChange>(
      `/api/submissions/${input.changeId}/publish`,
      {
        method: "POST",
        body: JSON.stringify({ reviewNote: input.note ?? null }),
      }
    );
    return afterPublishMutation(result);
  },

  async deleteDraft(input: DeleteDraftInput, _actor: DataManagementActor) {
    await apiRequest(`/api/submissions/${input.changeId}`, {
      method: "DELETE",
    });
    notifyDataStoreChanged();
  },

  async listAudit(changeId?: string) {
    const q = changeId ? `?changeId=${encodeURIComponent(changeId)}` : "";
    return apiRequest<DataChangeAuditEntry[]>(`/api/audit-logs${q}`);
  },
};
