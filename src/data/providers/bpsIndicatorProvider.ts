import type { Indicator, IndicatorDataset } from "../indicators";
import type { IndicatorProvider } from "./types";

/**
 * Placeholder BPS WebAPI provider.
 * Not active until VITE_BPS_API_BASE_URL and backend contract are available.
 * Do not invent endpoints or put secrets here.
 */
export const bpsIndicatorProvider: IndicatorProvider = {
  mode: "bps",
  async getDataset(): Promise<IndicatorDataset> {
    throw new Error(
      "BpsIndicatorProvider belum dikonfigurasi. Set VITE_BPS_API_BASE_URL dan implementasi kontrak API BPS."
    );
  },
  async getIndicators(): Promise<Indicator[]> {
    throw new Error("BpsIndicatorProvider belum dikonfigurasi.");
  },
  async getIndicator(): Promise<Indicator | undefined> {
    throw new Error("BpsIndicatorProvider belum dikonfigurasi.");
  },
  async getCategories(): Promise<string[]> {
    throw new Error("BpsIndicatorProvider belum dikonfigurasi.");
  },
};
