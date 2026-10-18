/**
 * Runtime overlay: PUBLISHED development-store changes applied on top of
 * the verified indicators.json dataset — without mutating the JSON file.
 *
 * When using local API mode, published values already come from the database;
 * session overlay is skipped.
 */

import type { Indicator, IndicatorValue } from "../data/indicators";
import { isApiMode } from "../lib/api";
import { listPublishedOverridesSync } from "./providers/developmentStoreProvider";
import type { IndicatorValueChange } from "./types";

export interface PublishedOverride {
  indicatorId: string;
  period: string;
  value: number | null;
  display: string | null;
  changeId: string;
  publishedAt: string | null;
}

export function getPublishedOverrides(): PublishedOverride[] {
  if (typeof window === "undefined") return [];
  if (isApiMode()) return [];

  const published = listPublishedOverridesSync();
  const map = new Map<string, IndicatorValueChange>();
  for (const c of published) {
    const key = `${c.indicatorId}::${c.period}`;
    const prev = map.get(key);
    if (!prev || (c.publishedAt ?? "") > (prev.publishedAt ?? "")) {
      map.set(key, c);
    }
  }
  return [...map.values()].map((c) => ({
    indicatorId: c.indicatorId,
    period: c.period,
    value: c.proposedValue,
    display: c.proposedDisplay,
    changeId: c.id,
    publishedAt: c.publishedAt,
  }));
}

function applyOverrideToValues(
  values: IndicatorValue[],
  overrides: PublishedOverride[],
  indicatorId: string
): IndicatorValue[] {
  const relevant = overrides.filter((o) => o.indicatorId === indicatorId);
  if (!relevant.length) return values;

  const byPeriod = new Map(values.map((v) => [v.period, { ...v }]));
  for (const o of relevant) {
    const existing = byPeriod.get(o.period);
    if (o.value === null) {
      byPeriod.set(o.period, {
        period: o.period,
        value: null,
        display: null,
        status: "unavailable",
      });
    } else {
      byPeriod.set(o.period, {
        period: o.period,
        value: o.value,
        display: o.display,
        status: "available",
        periodRaw: existing?.periodRaw,
      });
    }
  }
  return [...byPeriod.values()];
}

export function applyPublishedOverlay(indicators: Indicator[]): Indicator[] {
  const overrides = getPublishedOverrides();
  if (!overrides.length) return indicators;
  return indicators.map((ind) => ({
    ...ind,
    values: applyOverrideToValues(ind.values, overrides, ind.id),
  }));
}

export function applyPublishedOverlayToIndicator(
  indicator: Indicator
): Indicator {
  const overrides = getPublishedOverrides();
  if (!overrides.length) return indicator;
  return {
    ...indicator,
    values: applyOverrideToValues(indicator.values, overrides, indicator.id),
  };
}
