import { env } from "../../config/env";
import { isApiMode } from "../../lib/api";
import { cachedApiIndicatorProvider } from "./apiCache";
import { bpsIndicatorProvider } from "./bpsIndicatorProvider";
import { mockIndicatorProvider } from "./mockIndicatorProvider";
import type { IndicatorProvider } from "./types";

export type { IndicatorProvider } from "./types";
export {
  hydrateIndicatorCache,
  invalidateIndicatorCache,
  isIndicatorCacheReady,
  didIndicatorHydrateFail,
} from "./apiCache";

export function getIndicatorProvider(): IndicatorProvider {
  if (env.dataProvider === "bps") {
    return bpsIndicatorProvider;
  }
  if (env.dataProvider === "mock") {
    return mockIndicatorProvider;
  }
  if (env.dataProvider === "api" || isApiMode()) {
    return cachedApiIndicatorProvider;
  }
  return cachedApiIndicatorProvider;
}

export const indicatorProvider = getIndicatorProvider();
