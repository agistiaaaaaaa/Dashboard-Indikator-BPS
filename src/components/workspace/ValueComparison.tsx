import { formatNumber } from "../../utils/format";
import { formatValueDelta, computeValueDelta } from "../../data-management/validation";

interface ValueComparisonProps {
  previousValue: number | null;
  previousDisplay?: string | null;
  proposedValue: number | null;
  proposedDisplay?: string | null;
  unit?: string | null;
}

function displayOf(value: number | null, display?: string | null): string {
  if (value === null) return "Kosong";
  return display ?? formatNumber(value);
}

/** Emphasizes CURRENT vs PROPOSED for Admin review. */
export function ValueComparison({
  previousValue,
  previousDisplay,
  proposedValue,
  proposedDisplay,
  unit,
}: ValueComparisonProps) {
  const delta = computeValueDelta(previousValue, proposedValue);
  const unitSuffix = unit ? ` ${unit}` : "";

  return (
    <div className="ws-compare" aria-label="Perbandingan nilai">
      <div className="ws-compare-col">
        <p className="ws-compare-label">Nilai saat ini</p>
        <p className="ws-compare-value">
          {displayOf(previousValue, previousDisplay)}
          {previousValue !== null ? (
            <span className="kpi-unit">{unitSuffix}</span>
          ) : null}
        </p>
      </div>
      <div className="ws-compare-arrow" aria-hidden="true">
        →
      </div>
      <div className="ws-compare-col ws-compare-proposed">
        <p className="ws-compare-label">Nilai usulan</p>
        <p className="ws-compare-value">
          {displayOf(proposedValue, proposedDisplay)}
          {proposedValue !== null ? (
            <span className="kpi-unit">{unitSuffix}</span>
          ) : null}
        </p>
      </div>
      <div className="ws-compare-delta">
        <p className="ws-compare-label">Perubahan</p>
        <p className="ws-compare-value ws-compare-delta-value">
          {formatValueDelta(delta)}
        </p>
      </div>
    </div>
  );
}
