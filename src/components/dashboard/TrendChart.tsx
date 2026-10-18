import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Indicator } from "../../services/indicatorService";
import { getIndicatorSeries } from "../../services/indicatorService";
import { formatIndicatorValue, formatNumber, resolveDisplayUnit } from "../../utils/format";
import { EmptyState } from "./EmptyState";

interface TrendChartProps {
  indicators: Indicator[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TrendChart({ indicators, selectedId, onSelect }: TrendChartProps) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const [hoverPeriod, setHoverPeriod] = useState<string | null>(null);

  const selected =
    indicators.find((i) => i.id === selectedId) ?? indicators[0] ?? null;

  const series = useMemo(
    () => (selected ? getIndicatorSeries(selected.id) : []),
    [selected]
  );

  const availableCount = series.filter((p) => p.value !== null).length;
  const unit = selected ? resolveDisplayUnit(selected) : null;

  return (
    <section className="section panel chart-panel" aria-labelledby="trend-heading">
      <div className="section-head row-head chart-head">
        <div>
          <h2 id="trend-heading">Perkembangan Indikator</h2>
          <p className="section-desc">
            Deret waktu resmi. Periode tanpa data tetap menjadi celah.
          </p>
        </div>
        <div className="chart-controls">
          <label className="field compact">
            <span className="field-label">Indikator</span>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => onSelect(e.target.value)}
              aria-label="Pilih indikator untuk grafik"
              disabled={!indicators.length}
            >
              {indicators.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          </label>
          <div className="seg-control" role="group" aria-label="Mode tampilan">
            <button
              type="button"
              className={mode === "chart" ? "seg active" : "seg"}
              onClick={() => setMode("chart")}
            >
              Grafik
            </button>
            <button
              type="button"
              className={mode === "table" ? "seg active" : "seg"}
              onClick={() => setMode("table")}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {!selected ? (
        <EmptyState title="Indikator tidak ditemukan." />
      ) : availableCount < 2 && mode === "chart" ? (
        <EmptyState
          title="Data belum cukup untuk menampilkan tren."
          description={
            availableCount === 0
              ? "Tidak ada nilai tersedia untuk indikator ini."
              : "Hanya satu periode tersedia, sehingga tren tidak ditampilkan."
          }
        />
      ) : mode === "table" ? (
        <div className="table-wrap compact chart-table">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Periode</th>
                <th scope="col" className="num">
                  Nilai
                </th>
                <th scope="col">Satuan</th>
              </tr>
            </thead>
            <tbody>
              {series.map((v) => (
                <tr key={v.period}>
                  <td>{v.period}</td>
                  <td className="num">
                    {v.value === null
                      ? "Data belum tersedia"
                      : formatIndicatorValue(selected, {
                          period: v.period,
                          value: v.value,
                          display: v.display,
                          status: "available",
                        })}
                  </td>
                  <td>{v.value === null ? "" : unit ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-wrap" role="img" aria-label={`Grafik tren ${selected.name}`}>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart
              data={series}
              margin={{ top: 12, right: 18, left: 4, bottom: 8 }}
              onMouseMove={(state) => {
                const label = (state as { activeLabel?: string })?.activeLabel;
                setHoverPeriod(label ?? null);
              }}
              onMouseLeave={() => setHoverPeriod(null)}
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" strokeDasharray="2 6" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={28}
                axisLine={{ stroke: "var(--line)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                width={68}
                tickFormatter={(v: number) => formatNumber(v)}
                axisLine={false}
                tickLine={false}
                allowDecimals
              />
              {hoverPeriod ? (
                <ReferenceLine x={hoverPeriod} stroke="var(--brand-soft-strong)" strokeDasharray="3 3" />
              ) : null}
              <Tooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as {
                    value: number | null;
                    display: string | null;
                  };
                  let text = "Data belum tersedia";
                  if (row?.value !== null && row?.value !== undefined) {
                    const base =
                      row.display && row.display !== ""
                        ? row.display
                        : formatNumber(row.value);
                    text = unit === "%" ? `${base} %` : unit ? `${base} ${unit}` : base;
                  }
                  return (
                    <div className="chart-tooltip">
                      <p className="chart-tooltip-period">{String(label)}</p>
                      <p className="chart-tooltip-value">{text}</p>
                      <p className="chart-tooltip-name">{selected.name}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="linear"
                dataKey="value"
                stroke="none"
                fill="url(#chartFill)"
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="value"
                name="Nilai"
                stroke="var(--brand)"
                strokeWidth={2.5}
                dot={{ r: 3.25, fill: "#fff", stroke: "var(--brand)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "var(--brand)", stroke: "#fff", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="chart-dot" aria-hidden="true" />
            <div>
              <strong>{selected.name}</strong>
              <p className="chart-caption">
                {unit ? `Satuan: ${unit}. ` : ""}
                Sumber: {selected.source}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
