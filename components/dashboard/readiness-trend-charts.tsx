"use client";

import type { SessionTrendPoint } from "@/lib/readiness/types";

type ChartSeries = {
  key: keyof Pick<SessionTrendPoint, "communication" | "overall" | "readiness_index">;
  label: string;
  color: string;
};

const SERIES: ChartSeries[] = [
  { key: "communication", label: "Communication", color: "var(--chart-1, #3b82f6)" },
  { key: "overall", label: "Overall", color: "var(--chart-2, #8b5cf6)" },
  { key: "readiness_index", label: "Readiness index", color: "var(--chart-3, #10b981)" },
];

function MiniLineChart({
  points,
  dataKey,
  color,
  label,
}: {
  points: SessionTrendPoint[];
  dataKey: ChartSeries["key"];
  color: string;
  label: string;
}) {
  const width = 280;
  const height = 80;
  const padding = 8;
  const values = points.map((p) => p[dataKey]);
  const min = Math.max(0, Math.min(...values) - 5);
  const max = Math.min(100, Math.max(...values) + 5);
  const range = max - min || 1;

  const coords = values.map((v, i) => {
    const x =
      padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y =
      height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const last = values[values.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{last}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-20 text-muted-foreground"
        role="img"
        aria-label={`${label} trend`}
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={coords.join(" ")}
        />
        {coords.map((c, i) => {
          const [cx, cy] = c.split(",").map(Number);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              fill={color}
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        {points.map((p) => (
          <span key={p.session_id}>{p.label.replace("Session ", "S")}</span>
        ))}
      </div>
    </div>
  );
}

export function ReadinessTrendCharts({
  trends,
}: {
  trends: SessionTrendPoint[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {SERIES.map((s) => (
        <MiniLineChart
          key={s.key}
          points={trends}
          dataKey={s.key}
          color={s.color}
          label={s.label}
        />
      ))}
    </div>
  );
}
