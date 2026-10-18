/**
 * Authorization permissions for BPS data management.
 *
 * Authentication (who) vs authorization (what) stay separate.
 * Frontend checks are UX / defense-in-depth only.
 * The future BPS backend MUST enforce these rules independently.
 *
 * Public (unauthenticated) users have no workspace permissions.
 * They only consume PUBLISHED indicator data on the public site (read-only).
 */

import { ROLES, type Role } from "./roles";

export const PERMISSIONS = {
  /** Enter internal workspace shell. */
  VIEW_WORKSPACE: "view_workspace",

  /** Read indicator inventory inside workspace (including non-published drafts when backend supports it). */
  READ_INDICATOR_DATA: "read_indicator_data",

  /** Create/update indicator values via authorized workflow (never silent overwrite of published). */
  UPDATE_INDICATOR_VALUES: "update_indicator_values",

  /** Edit permitted indicator metadata (name presentation, notes, etc. — backend defines fields). */
  EDIT_INDICATOR_METADATA: "edit_indicator_metadata",

  /** Save work as DRAFT without submitting for review. */
  CREATE_DRAFT: "create_draft",

  /** Submit a draft for ADMIN review (PENDING_REVIEW). */
  SUBMIT_FOR_REVIEW: "submit_for_review",

  /** Operator view of their own submissions. */
  VIEW_OWN_SUBMISSIONS: "view_own_submissions",

  /** Admin queue of submissions awaiting review. */
  REVIEW_SUBMISSIONS: "review_submissions",

  /** Approve a pending change (moves toward publishable state). */
  APPROVE_CHANGES: "approve_changes",

  /** Reject a pending change (REJECTED). */
  REJECT_CHANGES: "reject_changes",

  /** Publish approved data so it becomes visible on the PUBLIC dashboard. */
  PUBLISH_DATA: "publish_data",

  /** View audit / change history. */
  VIEW_AUDIT_HISTORY: "view_audit_history",

  /** Manage internal users (ADMIN only). */
  MANAGE_USERS: "manage_users",

  /** Manage workspace/system settings (ADMIN only). */
  MANAGE_SETTINGS: "manage_settings",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLES.OPERATOR]: [
    PERMISSIONS.VIEW_WORKSPACE,
    PERMISSIONS.READ_INDICATOR_DATA,
    PERMISSIONS.UPDATE_INDICATOR_VALUES,
    PERMISSIONS.EDIT_INDICATOR_METADATA,
    PERMISSIONS.CREATE_DRAFT,
    PERMISSIONS.SUBMIT_FOR_REVIEW,
    PERMISSIONS.VIEW_OWN_SUBMISSIONS,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_WORKSPACE,
    PERMISSIONS.READ_INDICATOR_DATA,
    PERMISSIONS.UPDATE_INDICATOR_VALUES,
    PERMISSIONS.EDIT_INDICATOR_METADATA,
    PERMISSIONS.CREATE_DRAFT,
    PERMISSIONS.SUBMIT_FOR_REVIEW,
    PERMISSIONS.VIEW_OWN_SUBMISSIONS,
    PERMISSIONS.REVIEW_SUBMISSIONS,
    PERMISSIONS.APPROVE_CHANGES,
    PERMISSIONS.REJECT_CHANGES,
    PERMISSIONS.PUBLISH_DATA,
    PERMISSIONS.VIEW_AUDIT_HISTORY,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function listPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Public audience capabilities — not assigned to authenticated roles.
 * Documented here so authorization stays explicit.
 */
export const PUBLIC_CAPABILITIES = {
  READ_PUBLISHED_INDICATORS: true,
  VIEW_KPI_AND_CHARTS: true,
  SEARCH_FILTER_EXPORT: true,
  EDIT_DATA: false,
  ACCESS_WORKSPACE: false,
  PUBLISH_DATA: false,
} as const;

export interface WorkspaceNavItem {
  id: string;
  label: string;
  to: string;
  permission: Permission;
}

/**
 * Workspace navigation aligned to data-management workflow.
 * Filtered strictly by permission — Operator never sees Admin-only items.
 */
export const WORKSPACE_NAV: readonly WorkspaceNavItem[] = [
  {
    id: "ringkasan",
    label: "Ringkasan",
    to: "/workspace",
    permission: PERMISSIONS.VIEW_WORKSPACE,
  },
  {
    id: "pemutakhiran",
    label: "Pemutakhiran Data",
    to: "/workspace/pemutakhiran",
    permission: PERMISSIONS.UPDATE_INDICATOR_VALUES,
  },
  {
    id: "indikator",
    label: "Indikator",
    to: "/workspace/indikator",
    permission: PERMISSIONS.READ_INDICATOR_DATA,
  },
  {
    id: "pengajuan",
    label: "Pengajuan Saya",
    to: "/workspace/pengajuan",
    permission: PERMISSIONS.VIEW_OWN_SUBMISSIONS,
  },
  {
    id: "review",
    label: "Review / Persetujuan",
    to: "/workspace/review",
    permission: PERMISSIONS.REVIEW_SUBMISSIONS,
  },
  {
    id: "pengguna",
    label: "Pengguna (segera)",
    to: "/workspace/pengguna",
    permission: PERMISSIONS.MANAGE_USERS,
  },
  {
    id: "riwayat",
    label: "Riwayat",
    to: "/workspace/riwayat",
    permission: PERMISSIONS.VIEW_AUDIT_HISTORY,
  },
  {
    id: "pengaturan",
    label: "Pengaturan (segera)",
    to: "/workspace/pengaturan",
    permission: PERMISSIONS.MANAGE_SETTINGS,
  },
] as const;

export function getWorkspaceNavForRole(role: Role): WorkspaceNavItem[] {
  return WORKSPACE_NAV.filter((item) => roleHasPermission(role, item.permission));
}
