/**
 * Client-side validation for indicator value change drafts.
 * Conservative rules only — does not invent BPS business policy.
 */

import { getIndicator } from "../services/indicatorService";
import { formatNumber } from "../utils/format";

export interface DraftValidationInput {
  indicatorId: string;
  period: string;
  /** Raw form text for the proposed value. */
  valueText: string;
  sourceNote: string;
  changeNote: string;
  /** Allowed period labels (must preserve special periods as-is). */
  allowedPeriods: readonly string[];
  /** Previous published/current value for note significance check. */
  previousValue: number | null;
}

export interface DraftValidationResult {
  ok: true;
  proposedValue: number | null;
  proposedDisplay: string | null;
}

export type DraftValidationFailure = {
  ok: false;
  error: string;
};

/**
 * Parse Indonesian-style numeric input.
 * Empty → null (never coerced to 0). Invalid → error.
 */
export function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Reject obvious non-numeric tokens early
  if (/[a-zA-Z]/.test(trimmed) && !/^[-+]?\d/.test(trimmed)) {
    throw new Error(
      "Nilai tidak valid. Gunakan angka, atau kosongkan untuk nilai kosong."
    );
  }
  const normalized = trimmed.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (normalized === "" || normalized === "-" || normalized === "+") {
    throw new Error(
      "Nilai tidak valid. Gunakan angka, atau kosongkan untuk nilai kosong."
    );
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) {
    throw new Error(
      "Nilai tidak valid. Gunakan angka, atau kosongkan untuk nilai kosong."
    );
  }
  return n;
}

export function validateDraftInput(
  input: DraftValidationInput
): DraftValidationResult | DraftValidationFailure {
  const indicator = getIndicator(input.indicatorId);
  if (!indicator) {
    return { ok: false, error: "Indikator tidak ditemukan pada dataset terverifikasi." };
  }

  const period = input.period.trim();
  if (!period) {
    return { ok: false, error: "Periode wajib dipilih." };
  }
  if (!input.allowedPeriods.includes(period)) {
    return {
      ok: false,
      error:
        "Periode tidak dikenali. Gunakan label periode yang ada pada dataset (termasuk periode khusus).",
    };
  }

  let proposedValue: number | null;
  try {
    proposedValue = parseOptionalNumber(input.valueText);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Nilai tidak valid.",
    };
  }

  const source = input.sourceNote.trim();
  const note = input.changeNote.trim();
  const valueChanged = proposedValue !== input.previousValue;

  if (valueChanged && !note) {
    return {
      ok: false,
      error: "Catatan pemutakhiran wajib diisi bila nilai usulan berbeda dari nilai saat ini.",
    };
  }

  if (valueChanged && !source) {
    return {
      ok: false,
      error: "Sumber data wajib diisi bila nilai usulan berbeda dari nilai saat ini.",
    };
  }

  return {
    ok: true,
    proposedValue,
    proposedDisplay: proposedValue === null ? null : formatNumber(proposedValue),
  };
}

/** Numeric difference for review UI; null if either side is null. */
export function computeValueDelta(
  previous: number | null,
  proposed: number | null
): number | null {
  if (previous === null || proposed === null) return null;
  return proposed - previous;
}

export function formatValueDelta(delta: number | null): string {
  if (delta === null) return "Tidak dapat dihitung (nilai kosong)";
  if (delta === 0) return "0";
  const abs = formatNumber(Math.abs(delta));
  return delta > 0 ? `+${abs}` : `−${abs}`;
}
