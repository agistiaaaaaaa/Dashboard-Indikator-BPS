import type { Indicator, IndicatorValue } from "../data/indicators";
import {
  getDisplayName,
  resolveDisplayUnit,
  unitAlreadyInText,
} from "./presentation";

const idLocale = "id-ID";

/** Heuristic: treat as percentage-like for display/trend wording. */
export function isPercentageLike(indicator: Indicator): boolean {
  const unit = resolveDisplayUnit(indicator);
  if (unit === "%") return true;
  const n = indicator.name.toLowerCase();
  if (/gini|ikg|^ipm$|indeks pembangunan manusia/.test(n)) return false;
  return false;
}

export function isPercentagePointIndicator(indicator: Indicator): boolean {
  if (isIndexLike(indicator)) return false;
  const unit = resolveDisplayUnit(indicator);
  if (unit === "%") return true;
  const n = indicator.name.toLowerCase();
  return /persentase|tingkat penganguran|tingkat partisipasi|laju pdrb|pertumbuhan penduduk|pertumbuhan ekonomi/.test(
    n
  );
}

/** Index-like metrics (IPM, Gini, etc.) — absolute point change, not % relative. */
export function isIndexLike(indicator: Indicator): boolean {
  const n = indicator.name.toLowerCase();
  return /gini|ikg|^ipm$|indeks pembangunan|indeks pemberdayaan|indeks ketimpangan|indeks kedalaman|indeks keparahan|\(p1\)|\(p2\)/.test(
    n
  );
}

export function formatNumber(value: number, fractionDigits?: number): string {
  const opts: Intl.NumberFormatOptions =
    fractionDigits !== undefined
      ? { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }
      : { maximumFractionDigits: 6 };
  return new Intl.NumberFormat(idLocale, opts).format(value);
}

/**
 * Prefer source display string when present; otherwise format the numeric value.
 * Never invent values. Does not append units.
 */
export function formatIndicatorValue(
  _indicator: Indicator,
  point: IndicatorValue | null | undefined
): string {
  if (!point || point.value === null || point.status !== "available") {
    return "Data belum tersedia";
  }
  if (point.display != null && point.display !== "") {
    return point.display.trim();
  }
  return formatNumber(point.value);
}

/** Value + unit for compact contexts (KPI primary line, tooltips). */
export function formatValueWithUnit(
  indicator: Indicator,
  point: IndicatorValue | null | undefined
): string {
  const base = formatIndicatorValue(indicator, point);
  if (base === "Data belum tersedia") return base;
  const unit = resolveDisplayUnit(indicator);
  if (!unit || unitAlreadyInText(base, unit)) return base;
  return unit === "%" ? `${base} %` : `${base} ${unit}`;
}

export function formatPeriodLabel(period: string): string {
  return period;
}

export function formatAbsoluteChange(delta: number, fractionDigits = 2): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(delta), fractionDigits)}`;
}

export { getDisplayName, resolveDisplayUnit };
