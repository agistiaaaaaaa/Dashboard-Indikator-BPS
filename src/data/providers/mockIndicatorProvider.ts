import {
  categories,
  getIndicatorById,
  getIndicators,
  indicatorDataset,
  type Indicator,
  type IndicatorDataset,
} from "../indicators";
import type { IndicatorProvider } from "./types";

/** Local verified dataset provider (Phase 1 approved JSON). */
export const mockIndicatorProvider: IndicatorProvider = {
  mode: "mock",
  getDataset(): IndicatorDataset {
    return indicatorDataset;
  },
  getIndicators(): Indicator[] {
    return getIndicators();
  },
  getIndicator(id: string): Indicator | undefined {
    return getIndicatorById(id);
  },
  getCategories(): string[] {
    return categories;
  },
};
