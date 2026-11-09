import { Link } from "react-router-dom";
import { getFeaturedShortLabel } from "../../config/featuredIndicators";
import { getIndicator, getIndicatorSeries } from "../../services/indicatorService";
import { formatIndicatorValue, resolveDisplayUnit } from "../../utils/format";
import { formatChange, summarizeSeries, trimEmptyEdges } from "../../utils/seriesStats";
import { sentimentOf } from "../../utils/trend";
import { Icon } from "../ui/Icon";
import { Sparkline } from "./Sparkline";

/** The long-run story the landing page leads with; values are read from the dataset. */
const INSIGHT_INDICATOR_ID = "sosial__persentase-penduduk-miskin-p0";

export function HeroInsight() {
  const indicator = getIndicator(INSIGHT_INDICATOR_ID);
  if (!indicator) return null;

  const series = trimEmptyEdges(getIndicatorSeries(indicator.id));
  const summary = summarizeSeries(series);
  if (!summary) return null;

  const delta = summary.last.value - summary.first.value;
  const sentiment = sentimentOf(indicator, delta === 0 ? "flat" : delta > 0 ? "up" : "down");
  const unit = resolveDisplayUnit(indicator);
  const format = (point: typeof summary.first) =>
    `${formatIndicatorValue(indicator, { ...point, status: "available" })}${unit === "%" ? "%" : ""}`;
  const values = series.flatMap((p) => (p.value === null ? [] : [p.value]));

  return (
    <aside className="hero-insight" aria-label="Sorotan data">
      <p className="hero-insight-kicker">
        Sorotan {summary.first.period}–{summary.last.period}
      </p>
      <p className="hero-insight-title">{getFeaturedShortLabel(indicator.id) ?? indicator.name}</p>

      <div className="hero-insight-figures">
        <span className="hero-insight-from">{format(summary.first)}</span>
        <Icon name="arrow-right" size={18} />
        <span className="hero-insight-to">{format(summary.last)}</span>
      </div>

      <p className={`hero-insight-change is-${sentiment}`}>
        {formatChange(indicator, delta)} dalam {series.length - 1} tahun
      </p>

      <div className="hero-insight-chart">
        <Sparkline values={values} width={300} height={72} />
        <span className="hero-insight-axis">
          <span>{summary.first.period}</span>
          <span>{summary.last.period}</span>
        </span>
      </div>

      <Link
        to={`/dashboard-indikator?chart=${encodeURIComponent(indicator.id)}`}
        className="hero-insight-link"
      >
        Lihat analisis lengkap
        <Icon name="arrow-right" size={14} />
      </Link>
    </aside>
  );
}
