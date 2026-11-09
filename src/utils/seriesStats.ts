import type { Indicator } from "../data/indicators";
import {
  formatAbsoluteChange,
  formatNumber,
  isIndexLike,
  isPercentagePointIndicator,
} from "./format";
import { sentimentOf, type TrendSentiment } from "./trend";

export interface SeriesPoint {
  period: string;
  value: number | null;
  display: string | null;
}

export interface YearChange {
  period: string;
  previousPeriod: string;
  delta: number;
  sentiment: TrendSentiment;
}

export interface SeriesSummary {
  first: SeriesPoint & { value: number };
  last: SeriesPoint & { value: number };
  max: SeriesPoint & { value: number };
  min: SeriesPoint & { value: number };
  /** Mean change per available step, in the indicator's own unit. */
  averageChange: number;
}

type Available = SeriesPoint & { value: number };

const isAvailable = (p: SeriesPoint): p is Available => p.value !== null;

/** Drop leading/trailing empty periods; interior gaps stay so the chart shows them. */
export function trimEmptyEdges(series: SeriesPoint[]): SeriesPoint[] {
  const start = series.findIndex(isAvailable);
  if (start === -1) return [];
  let end = series.length - 1;
  while (end > start && !isAvailable(series[end])) end--;
  return series.slice(start, end + 1);
}

/** Last `count` periods of an already-trimmed series; `null` keeps everything. */
export function takeLast(series: SeriesPoint[], count: number | null): SeriesPoint[] {
  return count === null ? series : series.slice(-count);
}

export function summarizeSeries(series: SeriesPoint[]): SeriesSummary | null {
  const points = series.filter(isAvailable);
  if (points.length < 2) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const max = points.reduce((a, b) => (b.value > a.value ? b : a));
  const min = points.reduce((a, b) => (b.value < a.value ? b : a));
  const averageChange = (last.value - first.value) / (points.length - 1);

  return { first, last, max, min, averageChange };
}

/** Change between consecutive available values, coloured by indicator polarity. */
export function yearOverYear(indicator: Indicator, series: SeriesPoint[]): YearChange[] {
  const points = series.filter(isAvailable);
  return points.slice(1).map((point, i) => {
    const delta = point.value - points[i].value;
    const direction = Math.abs(delta) < 1e-12 ? "flat" : delta > 0 ? "up" : "down";
    return {
      period: point.period,
      previousPeriod: points[i].period,
      delta,
      sentiment: sentimentOf(indicator, direction),
    };
  });
}

/** Signed change in the wording the rest of the app uses ("poin", "poin persentase"). */
export function formatChange(indicator: Indicator, delta: number): string {
  if (isPercentagePointIndicator(indicator))
    return `${formatAbsoluteChange(delta)} poin persentase`;
  if (isIndexLike(indicator)) return `${formatAbsoluteChange(delta)} poin`;
  return formatAbsoluteChange(delta);
}

/** Axis ticks: compact from 1.000 up so long values never crowd the plot. */
export function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${formatNumber(value / 1e9, 1)} M`;
  if (abs >= 1e6) return `${formatNumber(value / 1e6, 1)} jt`;
  if (abs >= 1e4) return `${formatNumber(value / 1e3, 0)} rb`;
  return formatNumber(value, Number.isInteger(value) ? 0 : abs < 1 ? 2 : 1);
}

/**
 * Y-scale with round tick values (1, 2, 2.5, 5 × 10^n steps) and headroom, so a
 * slow-moving series is not flattened against a zero baseline.
 */
export function niceScale(
  series: SeriesPoint[],
  tickCount = 5,
): { domain: [number, number]; ticks: number[] } {
  const values = series.filter(isAvailable).map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }

  const rough = (max - min) / (tickCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;

  let lower = Math.floor(min / step) * step;
  if (lower === min) lower -= step;
  if (min >= 0 && lower < 0) lower = 0;
  const upper = Math.ceil(max / step) * step + (Math.ceil(max / step) * step === max ? step : 0);

  const ticks: number[] = [];
  for (let t = lower; t <= upper + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
  return { domain: [lower, upper], ticks };
}
