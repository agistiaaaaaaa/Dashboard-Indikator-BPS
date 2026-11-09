interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
}

/** Compact trend line with an end-point marker. Purely decorative. */
export function Sparkline({ values, width = 96, height = 32 }: SparklineProps) {
  if (values.length < 2) return null;

  const pad = 3;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: height - pad - ((v - min) / span) * (height - pad * 2),
  }));
  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${height} L${pad},${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <path className="sparkline-area" d={area} />
      <path className="sparkline-line" d={line} />
      <circle className="sparkline-dot" cx={last.x} cy={last.y} r={2.5} />
    </svg>
  );
}
