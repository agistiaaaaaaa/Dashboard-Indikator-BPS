/**
 * Indicator Service — runtime data access seam for the dashboard.
 * UI → Service → Provider (mock JSON today / BPS API later)
 *
 * Published development-store overrides are merged at read time only;
 * indicators.json is never mutated.
 */
import { FEATURED_INDICATOR_IDS } from "../config/featuredIndicators";
import {
  didIndicatorHydrateFail,
  isIndicatorCacheReady,
} from "../data/providers/apiCache";
import { indicatorProvider } from "../data/providers";
import type {
  Indicator,
  IndicatorDataset,
  IndicatorValue,
  ValueStatus,
} from "../data/indicators";
import {
  applyPublishedOverlay,
  applyPublishedOverlayToIndicator,
} from "../data-management/publishedOverlay";
import { uniqueSortedPeriods } from "../utils/periods";
import {
  calculateTrend,
  getTrendSeries,
  getValueAtPeriod,
  type TrendResult,
} from "../utils/trend";
import { downloadIndicatorsExcel } from "./export/exportIndicators";

export type { Indicator, IndicatorDataset, IndicatorValue, ValueStatus, TrendResult };

export interface IndicatorFilters {
  category?: string | null;
  period?: string | null;
  query?: string | null;
}

export interface CategorySummary {
  category: string;
  count: number;
}

function syncIndicators(): Indicator[] {
  const result = indicatorProvider.getIndicators();
  if (result instanceof Promise) {
    throw new Error("Provider async belum didukung di sync API; gunakan mock provider.");
  }
  return applyPublishedOverlay(result);
}

export function getDataset(): IndicatorDataset {
  const result = indicatorProvider.getDataset();
  if (result instanceof Promise) {
    throw new Error("Provider async belum didukung di sync API; gunakan mock provider.");
  }
  return {
    ...result,
    indicators: applyPublishedOverlay(result.indicators),
    highlights: applyPublishedOverlay(result.highlights),
  };
}

export function getIndicators(): Indicator[] {
  return syncIndicators();
}

export function getIndicator(id: string): Indicator | undefined {
  const result = indicatorProvider.getIndicator(id);
  if (result instanceof Promise) {
    throw new Error("Provider async belum didukung di sync API; gunakan mock provider.");
  }
  return result ? applyPublishedOverlayToIndicator(result) : undefined;
}

export function getCategories(): string[] {
  const result = indicatorProvider.getCategories();
  if (result instanceof Promise) {
    throw new Error("Provider async belum didukung di sync API; gunakan mock provider.");
  }
  return result;
}

export function getCategorySummaries(): CategorySummary[] {
  const indicators = getIndicators();
  const map = new Map<string, number>();
  for (const ind of indicators) {
    map.set(ind.category, (map.get(ind.category) ?? 0) + 1);
  }
  return getCategories().map((category) => ({
    category,
    count: map.get(category) ?? 0,
  }));
}

/** Annual + special periods from indicators and highlights. */
export function getPeriods(): string[] {
  const dataset = getDataset();
  const labels: string[] = [];
  for (const ind of dataset.indicators) {
    for (const v of ind.values) labels.push(v.period);
  }
  for (const h of dataset.highlights) {
    for (const v of h.values) labels.push(v.period);
  }
  return uniqueSortedPeriods(labels);
}

/** Latest annual period that appears in the Rekap inventory (not invented). */
export function getLatestAnnualPeriod(): string | null {
  const annual = getPeriods().filter((p) => /^(19|20)\d{2}$/.test(p));
  return annual.length ? annual[annual.length - 1] : null;
}

export function searchIndicators(query: string, list?: Indicator[]): Indicator[] {
  const q = query.trim().toLowerCase();
  const source = list ?? getIndicators();
  if (!q) return source;
  return source.filter(
    (ind) =>
      ind.name.toLowerCase().includes(q) ||
      ind.category.toLowerCase().includes(q) ||
      (ind.unit ?? "").toLowerCase().includes(q)
  );
}

export function filterIndicators(filters: IndicatorFilters): Indicator[] {
  let list = getIndicators();

  if (filters.category && filters.category !== "semua") {
    list = list.filter((i) => i.category === filters.category);
  }

  if (filters.query) {
    list = searchIndicators(filters.query, list);
  }

  // Period does NOT remove indicators from the list.
  // Special periods (e.g. "Maret 2025") may exist only in highlights;
  // Rekap indicators then correctly show "Data belum tersedia" for that period.
  return list;
}

export function getFeaturedIndicators(): Indicator[] {
  return FEATURED_INDICATOR_IDS.map((id) => getIndicator(id)).filter(
    (i): i is Indicator => Boolean(i)
  );
}

export function getIndicatorTrend(
  id: string,
  period: string | null = null
): TrendResult | null {
  const ind = getIndicator(id);
  if (!ind) return null;
  return calculateTrend(ind, period);
}

export function getIndicatorSeries(id: string) {
  const ind = getIndicator(id);
  if (!ind) return [];
  return getTrendSeries(ind);
}

export function getIndicatorValueAtPeriod(
  indicator: Indicator,
  period: string | null
): IndicatorValue | null {
  return getValueAtPeriod(indicator, period);
}

export function exportIndicators(filters: IndicatorFilters, filename?: string): void {
  const indicators = filterIndicators({
    category: filters.category,
    query: filters.query,
    period: undefined,
  });
  void downloadIndicatorsExcel({
    indicators,
    period: filters.period && filters.period !== "semua" ? filters.period : null,
    filename,
  });
}

export function isDataReady(): boolean {
  try {
    if (indicatorProvider.mode === "api") {
      if (didIndicatorHydrateFail()) return false;
      if (!isIndicatorCacheReady()) return false;
    }
    return getIndicators().length > 0;
  } catch {
    return false;
  }
}

export function getProviderMode(): "mock" | "api" | "bps" {
  return indicatorProvider.mode;
}

/** @deprecated Prefer getCategories */
export function listCategories(): string[] {
  return getCategories();
}

/** @deprecated Prefer getIndicators */
export function listIndicators(): Indicator[] {
  return getIndicators();
}

/** @deprecated Prefer getIndicator */
export function findIndicator(id: string): Indicator | undefined {
  return getIndicator(id);
}

export function listByCategory(category: string): Indicator[] {
  return filterIndicators({ category });
}

export function listHighlights() {
  return getDataset().highlights;
}

export function getLatestValue(indicator: Indicator): IndicatorValue | null {
  return getValueAtPeriod(indicator, null);
}
