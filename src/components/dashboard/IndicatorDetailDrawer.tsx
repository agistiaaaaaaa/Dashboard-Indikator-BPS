import { useEffect, useId, useMemo, useRef } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  getIndicator,
  getIndicatorSeries,
  getIndicatorTrend,
  getIndicatorValueAtPeriod,
} from "../../services/indicatorService";
import {
  formatIndicatorValue,
  formatValueWithUnit,
  resolveDisplayUnit,
} from "../../utils/format";

interface IndicatorDetailDrawerProps {
  indicatorId: string | null;
  period: string;
  onClose: () => void;
  onShowChart: (id: string) => void;
}

export function IndicatorDetailDrawer({
  indicatorId,
  period,
  onClose,
  onShowChart,
}: IndicatorDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const indicator = indicatorId ? getIndicator(indicatorId) : undefined;

  useEffect(() => {
    if (!indicatorId || !indicator) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [indicatorId, indicator, onClose]);

  const series = useMemo(
    () => (indicator ? getIndicatorSeries(indicator.id) : []),
    [indicator]
  );
  const chartable = series.filter((p) => p.value !== null).length >= 2;

  if (!indicatorId || !indicator) return null;

  const point = getIndicatorValueAtPeriod(
    indicator,
    period === "semua" ? null : period
  );
  const trend = getIndicatorTrend(indicator.id, period === "semua" ? null : period);
  const unit = resolveDisplayUnit(indicator);

  return (
    <div className="drawer-root" role="presentation">
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Tutup detail indikator"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="drawer-head">
          <div>
            <p className="eyebrow">{indicator.category}</p>
            <h2 id={titleId}>{indicator.name}</h2>
            <p className="drawer-meta">
              {[unit, indicator.source].filter(Boolean).join(", ")}
            </p>
          </div>
          <button ref={closeRef} type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>

        <div className="drawer-hero-stat">
          <p className="drawer-hero-label">Nilai terbaru</p>
          <p className="drawer-hero-value">
            {point ? formatValueWithUnit(indicator, point) : "Data belum tersedia"}
          </p>
          <p className="drawer-hero-period">
            {point?.period ?? (period !== "semua" ? period : "")}
          </p>
          {trend ? (
            <p className={`drawer-hero-trend trend-${trend.direction}`}>{trend.label}</p>
          ) : (
            <p className="drawer-hero-trend muted">Perubahan tidak dapat dihitung</p>
          )}
        </div>

        {chartable ? (
          <div className="drawer-mini-chart" aria-hidden="true">
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="drawerFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Area
                  type="linear"
                  dataKey="value"
                  stroke="none"
                  fill="url(#drawerFill)"
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="value"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        <dl className="detail-grid">
          <div>
            <dt>Definisi</dt>
            <dd>{indicator.description ?? "Definisi belum tersedia."}</dd>
          </div>
          <div>
            <dt>Satuan</dt>
            <dd>{unit ?? ""}</dd>
          </div>
          <div>
            <dt>Sumber</dt>
            <dd>{indicator.source}</dd>
          </div>
        </dl>

        <h3 className="drawer-sub">Nilai historis</h3>
        <div className="table-wrap compact">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Periode</th>
                <th scope="col" className="num">
                  Nilai
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {series.map((v) => (
                <tr key={v.period}>
                  <td>{v.period}</td>
                  <td className="num">
                    {v.value === null
                      ? "Data belum tersedia"
                      : formatIndicatorValue(indicator, {
                          period: v.period,
                          value: v.value,
                          display: v.display,
                          status: "available",
                        })}
                  </td>
                  <td>{v.value === null ? "Belum tersedia" : "Tersedia"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="drawer-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onShowChart(indicator.id);
              onClose();
            }}
          >
            Tampilkan di grafik
          </button>
        </div>
      </aside>
    </div>
  );
}
