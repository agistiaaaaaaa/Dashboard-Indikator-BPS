import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Indicator } from "../../services/indicatorService";
import { getIndicatorSeries, getIndicatorTrend } from "../../services/indicatorService";
import { formatIndicatorValue, resolveDisplayUnit } from "../../utils/format";
import {
  formatAxisValue,
  formatChange,
  niceScale,
  summarizeSeries,
  takeLast,
  trimEmptyEdges,
  yearOverYear,
  type SeriesPoint,
  type YearChange,
} from "../../utils/seriesStats";
import { EmptyState } from "./EmptyState";
import { TrendBadge } from "./TrendBadge";

interface TrendChartProps {
  indicators: Indicator[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const RANGES = [
  { id: "5", label: "5 th", count: 5 },
  { id: "10", label: "10 th", count: 10 },
  { id: "all", label: "Semua", count: null },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

/* Chart colours are CSS tokens on .trend-panel, validated against its dark surface. */
const COLOR = {
  line: "var(--chart-line)",
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
  surface: "var(--chart-surface)",
  positive: "var(--chart-positive)",
  negative: "var(--chart-negative)",
  neutral: "var(--chart-neutral)",
};

const AXIS_TICK = { fill: COLOR.axis, fontSize: 12 };

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function TrendChart({ indicators, selectedId, onSelect }: TrendChartProps) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const [range, setRange] = useState<RangeId>("all");
  const animate = useMemo(() => !prefersReducedMotion(), []);

  const selected = indicators.find((i) => i.id === selectedId) ?? indicators[0] ?? null;
  const count = RANGES.find((r) => r.id === range)?.count ?? null;

  const series = useMemo(
    () => (selected ? takeLast(trimEmptyEdges(getIndicatorSeries(selected.id)), count) : []),
    [selected, count],
  );
  const summary = useMemo(() => summarizeSeries(series), [series]);
  const scale = useMemo(() => (summary ? niceScale(series) : null), [series, summary]);
  const changes = useMemo(
    () => (selected ? yearOverYear(selected, series) : []),
    [selected, series],
  );

  const unit = selected ? resolveDisplayUnit(selected) : null;
  const trend = selected ? getIndicatorTrend(selected.id, null) : null;
  const format = (point: SeriesPoint) =>
    selected ? formatIndicatorValue(selected, { ...point, status: "available" }) : "";

  return (
    <section className="trend-panel" aria-labelledby="trend-heading">
      <header className="trend-panel-head">
        <div className="trend-picker">
          <h2 id="trend-heading" className="trend-eyebrow">
            Analisis tren
          </h2>
          <label className="trend-select">
            <span className="sr-only">Pilih indikator untuk grafik</span>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => onSelect(e.target.value)}
              disabled={!indicators.length}
            >
              {indicators.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="trend-controls">
          <SegmentedControl
            label="Rentang periode"
            value={range}
            options={RANGES.map(({ id, label }) => ({ id, label }))}
            onChange={setRange}
          />
          <SegmentedControl
            label="Mode tampilan"
            value={mode}
            options={[
              { id: "chart", label: "Grafik" },
              { id: "table", label: "Tabel" },
            ]}
            onChange={setMode}
          />
        </div>
      </header>

      {!selected ? (
        <EmptyState title="Indikator tidak ditemukan." />
      ) : !summary ? (
        <EmptyState
          title="Data belum cukup untuk menampilkan tren."
          description="Tren membutuhkan minimal dua periode dengan nilai tersedia."
        />
      ) : (
        <>
          <div className="trend-summary">
            <div className="trend-headline">
              <p className="trend-value">
                <span className="trend-number">{format(summary.last)}</span>
                {unit ? <span className="trend-unit">{unit}</span> : null}
              </p>
              <div className="trend-headline-meta">
                {trend ? <TrendBadge trend={trend} showComparison={false} /> : null}
                <span className="trend-period">
                  {trend ? `${trend.comparedLine} · ` : ""}
                  Periode {summary.first.period}–{summary.last.period}
                </span>
              </div>
            </div>

            <dl className="trend-stats">
              <div>
                <dt>Tertinggi</dt>
                <dd>
                  {format(summary.max)} <span>{summary.max.period}</span>
                </dd>
              </div>
              <div>
                <dt>Terendah</dt>
                <dd>
                  {format(summary.min)} <span>{summary.min.period}</span>
                </dd>
              </div>
              <div>
                <dt>Rata-rata per periode</dt>
                <dd>{formatChange(selected, summary.averageChange)}</dd>
              </div>
            </dl>
          </div>

          {mode === "table" ? (
            <SeriesTable series={series} format={format} unit={unit} />
          ) : (
            <>
              <div className="trend-chart" role="img" aria-label={`Grafik tren ${selected.name}`}>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={series} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="trendWash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLOR.line} stopOpacity={0.14} />
                        <stop offset="100%" stopColor={COLOR.line} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={COLOR.grid} vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={24}
                      dy={8}
                    />
                    <YAxis
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      domain={scale?.domain}
                      ticks={scale?.ticks}
                      tickFormatter={formatAxisValue}
                    />
                    <Tooltip
                      cursor={{ stroke: COLOR.axis, strokeWidth: 1 }}
                      content={({ active, payload }) => {
                        const point = payload?.[0]?.payload as SeriesPoint | undefined;
                        if (!active || !point) return null;
                        return (
                          <ChartTooltip
                            title={point.period}
                            value={point.value === null ? "Tidak tersedia" : format(point)}
                            unit={point.value === null ? null : unit}
                            caption={selected.name}
                          />
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="none"
                      fill="url(#trendWash)"
                      connectNulls={false}
                      isAnimationActive={animate}
                      animationDuration={900}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={COLOR.line}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      connectNulls={false}
                      dot={(props) => (
                        <EndDot key={props.index} {...props} lastIndex={series.length - 1} />
                      )}
                      activeDot={{ r: 5, fill: COLOR.line, stroke: COLOR.surface, strokeWidth: 2 }}
                      isAnimationActive={animate}
                      animationDuration={900}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {changes.length >= 2 ? (
                <ChangeColumns indicator={selected} changes={changes} animate={animate} />
              ) : null}
            </>
          )}

          <footer className="trend-foot">
            {unit ? <span>Satuan: {unit}</span> : null}
            <span>Sumber: {selected.source}</span>
            <span>Periode tanpa data tampil sebagai celah, tidak diisi nol.</span>
          </footer>
        </>
      )}
    </section>
  );
}

function ChangeColumns({
  indicator,
  changes,
  animate,
}: {
  indicator: Indicator;
  changes: YearChange[];
  animate: boolean;
}) {
  return (
    <div className="trend-changes">
      <div className="trend-changes-head">
        <h3>Perubahan antarperiode</h3>
        <ul className="trend-key" aria-label="Keterangan warna">
          <li>
            <span className="trend-key-swatch is-positive" aria-hidden="true" />
            Membaik
          </li>
          <li>
            <span className="trend-key-swatch is-negative" aria-hidden="true" />
            Memburuk
          </li>
          <li>
            <span className="trend-key-swatch is-neutral" aria-hidden="true" />
            Netral
          </li>
        </ul>
      </div>
      <div role="img" aria-label={`Perubahan antarperiode ${indicator.name}`}>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={changes} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COLOR.grid} vertical={false} />
            <XAxis
              dataKey="period"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              minTickGap={16}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={56}
              tickCount={3}
              tickFormatter={formatAxisValue}
            />
            <ReferenceLine y={0} stroke={COLOR.axis} />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
              content={({ active, payload }) => {
                const change = payload?.[0]?.payload as YearChange | undefined;
                if (!active || !change) return null;
                return (
                  <ChartTooltip
                    title={`${change.previousPeriod} ke ${change.period}`}
                    value={formatChange(indicator, change.delta)}
                    caption={SENTIMENT_LABEL[change.sentiment]}
                  />
                );
              }}
            />
            <Bar
              dataKey="delta"
              maxBarSize={24}
              shape={RoundedEndBar}
              isAnimationActive={animate}
              animationDuration={700}
            >
              {changes.map((c) => (
                <Cell key={c.period} fill={COLOR[c.sentiment]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const SENTIMENT_LABEL = {
  positive: "Membaik",
  negative: "Memburuk",
  neutral: "Tanpa arah baik/buruk",
} as const;

/** Column with a 4px rounded data-end and a square end on the zero baseline. */
function RoundedEndBar(props: unknown) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill,
    payload,
  } = props as {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    payload?: YearChange;
  };
  const top = Math.min(y, y + height);
  const h = Math.abs(height);
  if (!h || !width) return <g />;

  const r = Math.min(4, h, width / 2);
  const right = x + width;
  const bottom = top + h;
  const d =
    (payload?.delta ?? 0) >= 0
      ? `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${right - r} Q${right},${top} ${right},${top + r} V${bottom} Z`
      : `M${x},${top} H${right} V${bottom - r} Q${right},${bottom} ${right - r},${bottom} H${x + r} Q${x},${bottom} ${x},${bottom - r} Z`;
  return <path d={d} fill={fill} />;
}

/** Only the latest point gets a marker: a ringed dot with a soft pulse. */
function EndDot(props: { cx?: number; cy?: number; index?: number; lastIndex: number }) {
  const { cx, cy, index, lastIndex } = props;
  if (index !== lastIndex || cx === undefined || cy === undefined) return <g />;
  return (
    <g>
      <circle className="trend-end-pulse" cx={cx} cy={cy} r={5} fill={COLOR.line} />
      <circle cx={cx} cy={cy} r={5} fill={COLOR.line} stroke={COLOR.surface} strokeWidth={2} />
    </g>
  );
}

function ChartTooltip({
  title,
  value,
  unit = null,
  caption,
}: {
  title: string;
  value: string;
  unit?: string | null;
  caption: string;
}) {
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-value">
        {value}
        {unit ? <span className="chart-tooltip-unit"> {unit}</span> : null}
      </p>
      <p className="chart-tooltip-period">{title}</p>
      <p className="chart-tooltip-name">
        <span className="chart-tooltip-key" aria-hidden="true" />
        {caption}
      </p>
    </div>
  );
}

function SeriesTable({
  series,
  format,
  unit,
}: {
  series: SeriesPoint[];
  format: (point: SeriesPoint) => string;
  unit: string | null;
}) {
  return (
    <div className="table-wrap compact trend-table">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Periode</th>
            <th scope="col" className="num">
              Nilai{unit ? ` (${unit})` : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {series.map((point) => (
            <tr key={point.period}>
              <td>{point.period}</td>
              <td className="num">{point.value === null ? "—" : format(point)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="seg-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={option.id === value ? "seg active" : "seg"}
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
