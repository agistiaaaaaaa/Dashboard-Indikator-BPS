/**
 * Indicator reads from local API (published observations in DB).
 */
import type { Indicator, IndicatorDataset } from "../indicators";
import { apiRequest } from "../../lib/api";
import type { IndicatorProvider } from "./types";

interface ApiDataset {
  meta: IndicatorDataset["meta"];
  categories: string[];
  indicators: Indicator[];
  highlights: Indicator[];
}

export const apiIndicatorProvider: IndicatorProvider = {
  mode: "api",

  async getDataset(): Promise<IndicatorDataset> {
    const data = await apiRequest<ApiDataset>("/api/indicators");
    // Supplementary blocks remain available from baseline JSON in mock mode.
    // API mode focuses on published indicator series.
    return {
      meta: data.meta,
      categories: data.categories,
      indicators: data.indicators,
      highlights: data.highlights ?? [],
      supplementary: {
        produksi: [],
        distribusi: [],
        updateMaret2025Blocks: [],
      },
    } as unknown as IndicatorDataset;
  },

  async getIndicators(): Promise<Indicator[]> {
    const data = await this.getDataset();
    return data.indicators;
  },

  async getIndicator(id: string): Promise<Indicator | undefined> {
    try {
      return await apiRequest<Indicator>(`/api/indicators/${encodeURIComponent(id)}`);
    } catch {
      return undefined;
    }
  },

  async getCategories(): Promise<string[]> {
    const data = await this.getDataset();
    return data.categories;
  },
};
