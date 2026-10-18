/**
 * Environment configuration.
 * Never put API keys or secrets in frontend code.
 */
export const env = {
  /** Local/staging API base URL (public config only). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
  /** Future BPS WebAPI base URL */
  bpsApiBaseUrl: import.meta.env.VITE_BPS_API_BASE_URL as string | undefined,
  /**
   * Data provider mode:
   * - api (default): local Express API + DB
   * - mock: verified indicators.json only
   * - bps: official BPS provider (placeholder until contract exists)
   */
  dataProvider:
    (import.meta.env.VITE_DATA_PROVIDER as string | undefined) ?? "api",
  appTitle: "Dashboard Indikator Strategis",
} as const;
