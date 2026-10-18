import { useMemo } from "react";
import { getFeaturedShortLabel } from "../../config/featuredIndicators";
import {
  getFeaturedIndicators,
  getIndicatorSeries,
  getIndicatorTrend,
  getIndicatorValueAtPeriod,
  type Indicator,
} from "../../services/indicatorService";
import { formatIndicatorValue, resolveDisplayUnit } from "../../utils/format";
import { EmptyState } from "./EmptyState";

interface FeaturedIndicatorsProps {
  category: string;
  period: string;
  onSelect: (id: string) => void;
  onBrowseAll?: () => void;
}

export function FeaturedIndicators({
  category,
  period,
  onSelect,
  onBrowseAll,
}: FeaturedIndicatorsProps) {
  const cards = useMemo(() => {
    let list = getFeaturedIndicators();
    if (category !== "semua") {
      list = list.filter((i) => i.category === category);
    }
    return list;
  }, [category]);

  if (!cards.length) {
    return (
      <EmptyState
        title="Indikator utama tidak tersedia untuk filter ini."
        description="Ubah kategori atau lihat Eksplorasi Indikator."
      />
    );
  }

  return (
    <section className="section" aria-labelledby="featured-heading">
      <div className="section-head row-head">
        <div>
          <h2 id="featured-heading">Indikator Utama</h2>
          <p className="section-desc">Ringkasan indikator strategis pilihan.</p>
        </div>
        {onBrowseAll ? (
          <button type="button" className="text-link" onClick={onBrowseAll}>
            Lihat semua indikator →
          </button>
        ) : null}
      </div>
      <div className="kpi-grid">
        {cards.map((ind) => (
          <FeaturedCard
            key={ind.id}
            indicator={ind}
            period={period}
            onSelect={() => onSelect(ind.id)}
          />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({
  indicator,
  period,
  onSelect,
}: {
  indicator: Indicator;
  period: string;
  onSelect: () => void;
}) {
  const point = getIndicatorValueAtPeriod(
    indicator,
    period === "semua" ? null : period
  );
  const trend = getIndicatorTrend(indicator.id, period === "semua" ? null : period);
  const unavailable = !point;
  const title = getFeaturedShortLabel(indicator.id) ?? indicator.name;
  const unit = resolveDisplayUnit(indicator);
  const valueText = unavailable ? null : formatIndicatorValue(indicator, point);
  const periodLabel = point?.period ?? (period !== "semua" ? period : null);
  const series = getIndicatorSeries(indicator.id)
    .filter((p) => p.value !== null)
    .slice(-8);
  const tone = trend?.direction === "down" ? "down" : trend?.direction === "up" ? "up" : "neutral";

  return (
    <article className={`kpi-card tone-${tone}`}>
      <button
        type="button"
        className="kpi-hit"
        onClick={onSelect}
        aria-label={`Detail ${indicator.name}`}
        title={indicator.name}
      >
        <div className="kpi-top">
          <span className={`kpi-glyph tone-${tone}`} aria-hidden="true">
            {glyphFor(indicator)}
          </span>
          {series.length >= 2 ? <MiniSpark values={series.map((s) => s.value as number)} tone={tone} /> : null}
        </div>

        <h3 className="kpi-title">{title}</h3>

        {unavailable ? (
          <p className="kpi-value is-empty">Data belum tersedia</p>
        ) : (
          <p className="kpi-value" aria-label={`${valueText}${unit ? ` ${unit}` : ""}`}>
            <span className="kpi-number">{valueText}</span>
            {unit ? <span className="kpi-unit">{unit}</span> : null}
          </p>
        )}

        <p className="kpi-period">{periodLabel ? `Periode ${periodLabel}` : ""}</p>

        {trend ? (
          <div
            className={`kpi-trend trend-${trend.direction}`}
            aria-label={`Perubahan: ${trend.label}`}
          >
            <p className="kpi-trend-change">{trend.changeLine}</p>
            {trend.comparedLine ? (
              <p className="kpi-trend-compare">{trend.comparedLine}</p>
            ) : null}
          </div>
        ) : (
          <p className="kpi-trend muted">Perubahan tidak dapat dihitung</p>
        )}
      </button>
    </article>
  );
}

function MiniSpark({ values, tone }: { values: number[]; tone: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 72;
  const h = 28;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className={`mini-spark tone-${tone}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function glyphFor(indicator: Indicator) {
  const id = indicator.id;
  if (id.includes("penduduk") && !id.includes("miskin")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
        />
      </svg>
    );
  }
  if (id.includes("pdrb") || id.includes("pertumbuhan")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="currentColor" d="M4 18h16v2H4v-2Zm2-2 4-5 3 3.5L17 8l3 3V9l-3-3-4.5 6L10 9l-4 5v2Z" />
      </svg>
    );
  }
  if (id.includes("miskin")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 3 7v2h18V7L12 2Zm-7 9v8h2v-8H5Zm5 0v8h4v-8h-4Zm7 0v8h2v-8h-2ZM3 20h18v2H3v-2Z"
        />
      </svg>
    );
  }
  if (id.includes("penganguran")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10 4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v3H2V7a2 2 0 0 1 2-2h4V4Zm-6 8h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Z"
        />
      </svg>
    );
  }
  if (id.includes("ipm")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 4.5 6.5v11L12 22l7.5-4.5v-11L12 2Zm0 2.2 5.5 3.3v8.9L12 19.8l-5.5-3.4V7.5L12 4.2Z"
        />
      </svg>
    );
  }
  if (id.includes("tpak")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 4h10v2H7V4Zm-2 4h14a2 2 0 0 1 2 2v10H3V10a2 2 0 0 1 2-2Zm2 3v7h10v-7H7Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
    </svg>
  );
}
