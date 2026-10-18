import type { Indicator, IndicatorDataset } from "../indicators";

/**
 * Data provider contract — swap MockIndicatorProvider for BpsIndicatorProvider later
 * without rewriting dashboard UI.
 */
export interface IndicatorProvider {
  readonly mode: "mock" | "api" | "bps";
  getDataset(): Promise<IndicatorDataset> | IndicatorDataset;
  getIndicators(): Promise<Indicator[]> | Indicator[];
  getIndicator(id: string): Promise<Indicator | undefined> | Indicator | undefined;
  getCategories(): Promise<string[]> | string[];
}
