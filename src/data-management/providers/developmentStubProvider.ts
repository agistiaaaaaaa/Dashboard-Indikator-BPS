/**
 * ============================================================================
 * DEVELOPMENT STUB — Data Management Provider
 * ============================================================================
 *
 * This stub exists so the UI/architecture can import a stable seam.
 * It does NOT persist data, does NOT mutate indicators.json, and is
 * NOT a production backend.
 *
 * Production data management requires an official BPS backend contract.
 * ============================================================================
 */

import type {
  DataChangeAuditEntry,
  DataManagementActor,
  DataManagementProvider,
  IndicatorValueChange,
  PublishChangeInput,
  ReviewChangeInput,
  SaveDraftValueInput,
  SubmitChangeInput,
} from "../types";

const NOT_CONNECTED =
  "Data management backend belum tersedia. Kontrak API resmi BPS belum disediakan. Stub ini tidak menyimpan perubahan.";

export const developmentStubDataManagementProvider: DataManagementProvider = {
  mode: "development-stub",

  async listChanges() {
    return [];
  },

  async getChange() {
    return null;
  },

  async saveDraft(
    _input: SaveDraftValueInput,
    _actor: DataManagementActor
  ): Promise<IndicatorValueChange> {
    throw new Error(NOT_CONNECTED);
  },

  async submitForReview(
    _input: SubmitChangeInput,
    _actor: DataManagementActor
  ): Promise<IndicatorValueChange> {
    throw new Error(NOT_CONNECTED);
  },

  async reviewChange(
    _input: ReviewChangeInput,
    _actor: DataManagementActor
  ): Promise<IndicatorValueChange> {
    throw new Error(NOT_CONNECTED);
  },

  async publishChange(
    _input: PublishChangeInput,
    _actor: DataManagementActor
  ): Promise<IndicatorValueChange> {
    throw new Error(NOT_CONNECTED);
  },

  async deleteDraft() {
    throw new Error(NOT_CONNECTED);
  },

  async listAudit(_changeId?: string): Promise<DataChangeAuditEntry[]> {
    return [];
  },
};
