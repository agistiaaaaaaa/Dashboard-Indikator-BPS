import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDataStoreRevision } from "./useDataStoreRevision";
import {
  filterIndicators,
  getCategories,
  getIndicator,
  getPeriods,
  type IndicatorFilters,
} from "../services/indicatorService";

export interface DashboardFilterState {
  category: string;
  period: string;
  query: string;
  chartIndicatorId: string | null;
  detailIndicatorId: string | null;
}

const DEFAULTS = {
  category: "semua",
  period: "semua",
  query: "",
} as const;

function sanitizeCategory(raw: string | null, categories: string[]): string {
  if (!raw || raw === DEFAULTS.category) return DEFAULTS.category;
  return categories.includes(raw) ? raw : DEFAULTS.category;
}

function sanitizePeriod(raw: string | null, periods: string[]): string {
  if (!raw || raw === DEFAULTS.period) return DEFAULTS.period;
  return periods.includes(raw) ? raw : DEFAULTS.period;
}

function sanitizeIndicatorId(raw: string | null): string | null {
  if (!raw) return null;
  return getIndicator(raw) ? raw : null;
}

export function useDashboardFilters() {
  const [params, setParams] = useSearchParams();
  const revision = useDataStoreRevision();
  const categories = useMemo(() => getCategories(), [revision]);
  const periods = useMemo(() => getPeriods(), [revision]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    let dirty = false;

    const cat = params.get("category");
    if (cat && cat !== DEFAULTS.category && !categories.includes(cat)) {
      next.delete("category");
      dirty = true;
    }

    const per = params.get("period");
    if (per && per !== DEFAULTS.period && !periods.includes(per)) {
      next.delete("period");
      dirty = true;
    }

    const chart = params.get("chart");
    if (chart && !getIndicator(chart)) {
      next.delete("chart");
      dirty = true;
    }

    const detail = params.get("detail");
    if (detail && !getIndicator(detail)) {
      next.delete("detail");
      dirty = true;
    }

    if (dirty) setParams(next, { replace: true });
  }, [params, categories, periods, setParams]);

  const state: DashboardFilterState = useMemo(() => {
    return {
      category: sanitizeCategory(params.get("category"), categories),
      period: sanitizePeriod(params.get("period"), periods),
      query: params.get("q") ?? DEFAULTS.query,
      chartIndicatorId: sanitizeIndicatorId(params.get("chart")),
      detailIndicatorId: sanitizeIndicatorId(params.get("detail")),
    };
  }, [params, categories, periods, revision]);

  const filters: IndicatorFilters = useMemo(
    () => ({
      category: state.category,
      period: state.period,
      query: state.query,
    }),
    [state.category, state.period, state.query]
  );

  const filteredIndicators = useMemo(
    () => filterIndicators(filters),
    [filters, revision]
  );

  const setFilter = useCallback(
    (patch: Partial<DashboardFilterState>, options?: { replace?: boolean }) => {
      const replace = options?.replace ?? false;
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const entries: Array<
            [keyof DashboardFilterState, string | null | undefined]
          > = [
            ["category", patch.category],
            ["period", patch.period],
            ["query", patch.query],
            ["chartIndicatorId", patch.chartIndicatorId],
            ["detailIndicatorId", patch.detailIndicatorId],
          ];

          for (const [key, value] of entries) {
            if (value === undefined) continue;
            const paramKey =
              key === "query"
                ? "q"
                : key === "chartIndicatorId"
                  ? "chart"
                  : key === "detailIndicatorId"
                    ? "detail"
                    : key;

            if (
              value === null ||
              value === "" ||
              (paramKey === "category" && value === DEFAULTS.category) ||
              (paramKey === "period" && value === DEFAULTS.period)
            ) {
              next.delete(paramKey);
            } else {
              next.set(paramKey, value);
            }
          }
          return next;
        },
        { replace }
      );
    },
    [setParams]
  );

  return {
    state,
    filters,
    categories,
    periods,
    filteredIndicators,
    setFilter,
  };
}
