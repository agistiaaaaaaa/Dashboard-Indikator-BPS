/**
 * Centralized role definitions for BPS internal workspace.
 * Do not scatter raw role strings in UI components — import from here.
 */

export const ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: "Administrator",
  [ROLES.OPERATOR]: "Operator",
};

export function isRole(value: unknown): value is Role {
  return value === ROLES.ADMIN || value === ROLES.OPERATOR;
}
