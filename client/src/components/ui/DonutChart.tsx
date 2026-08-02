import React from "react";

export interface DonutChartItem {
  label: string;
  value: number;
  color?: string;
}

const PALETTE = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
];

// A donut chart built from plain SVG arcs — no charting library dependency,
// consistent with the rest of the app's hand-rolled RankedBarList/DailyTrendChart.
export const DonutChart: React.FC<{
  items: DonutChartItem[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  valueFormatter?: (v: number) => string;
  emptyMessage?: string;
}> = ({
  items,
  size = 200,
  thickness = 28,
  centerLabel,
  centerValue,
  valueFormatter = (v) => v.toLocaleString(),
  emptyMessage = "No data yet",
}) => {
  const total = items.reduce((sum, i) => sum + i.value, 0);

  if (items.length === 0 || total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-sm text-slate-400"
        style={{ minHeight: size }}
      >
        {emptyMessage}
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segments = items.map((item, idx) => {
    const fraction = item.value / total;
    const previousFractionSum = items
      .slice(0, idx)
      .reduce((sum, previousItem) => sum + previousItem.value / total, 0);
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const offset = -previousFractionSum * circumference;
    return {
      ...item,
      color: item.color || PALETTE[idx % PALETTE.length],
      dash,
      gap,
      offset,
      percent: Math.round(fraction * 100),
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              className="transition-all duration-700 ease-out hover:opacity-80"
            >
              <title>
                {seg.label}: {valueFormatter(seg.value)} ({seg.percent}%)
              </title>
            </circle>
          ))}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-xl font-bold text-slate-800">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-slate-400">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      <div className="w-full min-w-0 space-y-2 sm:w-auto">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
              {seg.label}
            </span>
            <span className="shrink-0 text-slate-400">{seg.percent}%</span>
            <span className="shrink-0 font-semibold text-slate-800">
              {valueFormatter(seg.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};