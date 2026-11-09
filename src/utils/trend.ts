import type { Indicator, IndicatorValue } from "../data/indicators";
import { formatAbsoluteChange, formatNumber, isIndexLike, isPercentagePointIndicator } from "./format";
import { comparePeriods } from "./periods";

export type TrendDirection = "up" | "down" | "flat";
/** Whether a change is good or bad for the region, given the indicator polarity. */
export type TrendSentiment = "positive" | "negative" | "neutral";

export interface TrendResult {
  current: IndicatorValue;
  previous: IndicatorValue;
  absoluteChange: number;
  relativeChange: number | null;
  direction: TrendDirection;
  sentiment: TrendSentiment;
  /** Full accessible sentence */
  label: string;
  /** Unsigned size of the change, e.g. "1,39 poin persentase" */
  magnitude: string;
  /** e.g. "↓ 1,39 poin persentase" */
  changeLine: string;
  /** e.g. "dibanding 2024" */
  comparedLine: string;
}

/**
 * Indicators where a lower value is the better outcome (poverty, unemployment,
 * mortality, inequality). Matched on id + name because ids carry source typos
 * such as "penganguran".
 */
const LOWER_IS_BETTER =
  /miskin|kemiskinan|pengangg?uran|\btpt\b|kematian|kesakitan|morbiditas|gini|stunting|buta huruf|keparahan|kedalaman|inflasi|putus sekolah/i;

/**
 * Descriptive measures where neither direction is an improvement. Checked
 * first: the poverty line rises with prices, not with worsening poverty.
 */
const NO_POLARITY =
  /garis kemiskinan|^jumlah penduduk \(|kepadatan|laju pertumbuhan penduduk|rasio jenis kelamin/i;

export function isLowerBetter(indicator: Indicator): boolean {
  return LOWER_IS_BETTER.test(`${indicator.id} ${indicator.name}`);
}

export function sentimentOf(indicator: Indicator, direction: TrendDirection): TrendSentiment {
  if (direction === "flat" || NO_POLARITY.test(indicator.name)) return "neutral";
  const improved = isLowerBetter(indicator) ? direction === "down" : direction === "up";
  return improved ? "positive" : "negative";
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

  const comparedLine = `dibanding ${previous.period}`;
  let magnitude = "";
  if (direction !== "flat") {
    const delta = Math.abs(absoluteChange);
    if (isPercentagePointIndicator(indicator)) {
      magnitude = `${formatNumber(delta, 2)} poin persentase`;
    } else if (isIndexLike(indicator)) {
      magnitude = `${formatNumber(delta, 2)} poin`;
    } else {
      magnitude = formatAbsoluteChange(absoluteChange).replace(/^[+−]/, "");
    }
  }

  const arrow = direction === "down" ? "↓" : "↑";
  const changeLine = direction === "flat" ? "Tidak berubah" : `${arrow} ${magnitude}`;
  const label =
    direction === "flat"
      ? `Tidak berubah ${comparedLine}`
      : `${direction === "up" ? "Naik" : "Turun"} ${magnitude} ${comparedLine}`;

  return {
    current,
    previous,
    absoluteChange,
    relativeChange,
    direction,
    sentiment: sentimentOf(indicator, direction),
    label,
    magnitude,
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
