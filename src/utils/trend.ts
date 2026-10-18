import type { Indicator, IndicatorValue } from "../data/indicators";
import { formatAbsoluteChange, formatNumber, isIndexLike, isPercentagePointIndicator } from "./format";
import { comparePeriods } from "./periods";

export type TrendDirection = "up" | "down" | "flat";

export interface TrendResult {
  current: IndicatorValue;
  previous: IndicatorValue;
  absoluteChange: number;
  relativeChange: number | null;
  direction: TrendDirection;
  /** Full accessible sentence */
  label: string;
  /** e.g. "↓ 1,39 poin persentase" */
  changeLine: string;
  /** e.g. "dibanding 2024" */
  comparedLine: string | null;
}

function availablePoints(indicator: Indicator): IndicatorValue[] {
  return indicator.values
    .filter((v) => v.value !== null && v.status === "available")
    .slice()
    .sort((a, b) => comparePeriods(a.period, b.period));
}

export function getValueAtPeriod(
  indicator: Indicator,
  period: string | null
): IndicatorValue | null {
  if (!period || period === "semua") {
    const pts = availablePoints(indicator);
    return pts.length ? pts[pts.length - 1] : null;
  }
  const found = indicator.values.find((v) => v.period === period);
  if (!found || found.value === null || found.status !== "available") return null;
  return found;
}

export function getPreviousAvailable(
  indicator: Indicator,
  currentPeriod: string
): IndicatorValue | null {
  const pts = availablePoints(indicator);
  const idx = pts.findIndex((p) => p.period === currentPeriod);
  if (idx <= 0) return null;
  return pts[idx - 1];
}

export function calculateTrend(
  indicator: Indicator,
  period: string | null = null
): TrendResult | null {
  const current = getValueAtPeriod(indicator, period);
  if (!current || current.value === null) return null;

  const previous = getPreviousAvailable(indicator, current.period);
  if (!previous || previous.value === null) return null;

  const absoluteChange = current.value - previous.value;
  const relativeChange =
    previous.value === 0 ? null : (absoluteChange / Math.abs(previous.value)) * 100;

  const direction: TrendDirection =
    Math.abs(absoluteChange) < 1e-12 ? "flat" : absoluteChange > 0 ? "up" : "down";

  let changeLine: string;
  let comparedLine: string | null = `dibanding ${previous.period}`;

  if (direction === "flat") {
    changeLine = "Tidak berubah";
    comparedLine = `dibanding ${previous.period}`;
  } else if (isPercentagePointIndicator(indicator)) {
    const arrow = direction === "down" ? "↓" : "↑";
    changeLine = `${arrow} ${formatNumber(Math.abs(absoluteChange), 2)} poin persentase`;
  } else if (isIndexLike(indicator)) {
    const arrow = direction === "down" ? "↓" : "↑";
    changeLine = `${arrow} ${formatNumber(Math.abs(absoluteChange), 2)} poin`;
  } else {
    const arrow = direction === "down" ? "↓" : "↑";
    const abs = formatAbsoluteChange(absoluteChange).replace(/^\+/, "").replace(/^−/, "");
    changeLine = `${arrow} ${abs}`;
  }

  const label =
    direction === "flat"
      ? `Tidak berubah dibanding ${previous.period}`
      : `${changeLine} ${comparedLine}`;

  return {
    current,
    previous,
    absoluteChange,
    relativeChange,
    direction,
    label,
    changeLine,
    comparedLine,
  };
}

/** Series for charts — null values preserved as gaps (never coerced to 0). */
export function getTrendSeries(
  indicator: Indicator
): Array<{ period: string; value: number | null; display: string | null }> {
  return indicator.values
    .slice()
    .sort((a, b) => comparePeriods(a.period, b.period))
    .map((v) => ({
      period: v.period,
      value: v.status === "available" ? v.value : null,
      display: v.display,
    }));
}
