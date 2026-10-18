/**
 * Sync cache over async API indicator provider.
 * Hydrated at app boot; refreshed after publish.
 * Reads never throw — empty dataset when not ready (UI shows ErrorState).
 */
import type { Indicator, IndicatorDataset } from "../indicators";
import { apiIndicatorProvider } from "./apiIndicatorProvider";
import type { IndicatorProvider } from "./types";

let cache: IndicatorDataset | null = null;
let hydrateFailed = false;

const EMPTY_DATASET = {
  meta: {} as IndicatorDataset["meta"],
  categories: [] as string[],
  indicators: [] as Indicator[],
  highlights: [] as Indicator[],
  supplementary: {} as IndicatorDataset["supplementary"],
} as IndicatorDataset;

export async function hydrateIndicatorCache(): Promise<void> {
  try {
    cache = await apiIndicatorProvider.getDataset();
    hydrateFailed = false;
  } catch (err) {
    cache = null;
    hydrateFailed = true;
    throw err;
  }
}

export function getCachedDataset(): IndicatorDataset | null {
  return cache;
}

export function isIndicatorCacheReady(): boolean {
  return cache !== null && cache.indicators.length > 0;
}

export function didIndicatorHydrateFail(): boolean {
  return hydrateFailed;
}

export function invalidateIndicatorCache(): void {
  cache = null;
}

function getCachedDatasetSafe(): IndicatorDataset {
  return cache ?? EMPTY_DATASET;
}

export const cachedApiIndicatorProvider: IndicatorProvider = {
  mode: "api",

  getDataset(): IndicatorDataset {
    return getCachedDatasetSafe();
  },

  getIndicators(): Indicator[] {
    return getCachedDatasetSafe().indicators;
  },

  getIndicator(id: string): Indicator | undefined {
    return getCachedDatasetSafe().indicators.find((i) => i.id === id);
  },

  getCategories(): string[] {
    return getCachedDatasetSafe().categories;
  },
};
