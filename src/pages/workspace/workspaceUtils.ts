import type { AuthUser } from "../../auth";
import type { DataManagementActor } from "../../data-management";

export function toActor(user: AuthUser): DataManagementActor {
  return {
    userId: user.id,
    name: user.name,
    role: user.role,
  };
}

export { parseOptionalNumber } from "../../data-management/validation";

export function formatStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING_REVIEW":
      return "Menunggu review";
    case "PUBLISHED":
      return "Dipublikasikan";
    case "REJECTED":
      return "Ditolak";
    default:
      return status;
  }
}

export function formatDisplayValue(
  value: number | null,
  display: string | null | undefined,
  formatNumber: (n: number) => string
): string {
  if (value === null) return "Kosong";
  return display ?? formatNumber(value);
}
