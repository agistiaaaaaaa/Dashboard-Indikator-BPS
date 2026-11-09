import type { ReactNode } from "react";
import { getFeaturedShortLabel } from "../../config/featuredIndicators";
import {
  getIndicatorSeries,
  getIndicatorTrend,
  getIndicatorValueAtPeriod,
  type Indicator,
} from "../../services/indicatorService";
import { formatIndicatorValue, resolveDisplayUnit } from "../../utils/format";
import { Sparkline } from "./Sparkline";
import { TrendBadge } from "./TrendBadge";

interface IndicatorStatCardProps {
  indicator: Indicator;
  /** Specific period, or null for the latest available value. */
  period: string | null;
  /**
   * Renders the interactive shell (a Link or button) around the card body so
   * the same card works for navigation and in-page selection.
   */
  renderShell: (body: ReactNode) => ReactNode;
}

const SPARK_POINTS = 8;

export function IndicatorStatCard({ indicator, period, renderShell }: IndicatorStatCardProps) {
  const point = getIndicatorValueAtPeriod(indicator, period);
  const trend = getIndicatorTrend(indicator.id, period);
  const unit = resolveDisplayUnit(indicator);
  const title = getFeaturedShortLabel(indicator.id) ?? indicator.name;
  const periodLabel = point?.period ?? period;
  const series = getIndicatorSeries(indicator.id)
    .map((p) => p.value)
    .filter((v): v is number => v !== null)
    .slice(-SPARK_POINTS);

  const body = (
    <>
      <header className="stat-card-head">
        <h3 className="stat-card-title">{title}</h3>
        {periodLabel ? <span className="stat-card-period">{periodLabel}</span> : null}
      </header>

      {point ? (
        <p className="stat-card-value">
          <span className="stat-number">{formatIndicatorValue(indicator, point)}</span>
          {unit ? <span className="stat-unit">{unit}</span> : null}
        </p>
      ) : (
        <p className="stat-card-value is-empty">Data belum tersedia</p>
      )}

      <footer className="stat-card-foot">
        {trend ? (
          <TrendBadge trend={trend} />
        ) : (
          <span className="trend-compare">Perubahan tidak dapat dihitung</span>
        )}
        <Sparkline values={series} />
      </footer>
    </>
  );

  return <article className="stat-card">{renderShell(body)}</article>;
}
