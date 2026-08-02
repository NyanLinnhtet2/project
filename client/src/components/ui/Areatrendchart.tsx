import React from "react";

export interface AreaTrendPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export const AreaTrendChart: React.FC<{
  points: AreaTrendPoint[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
  emptyMessage?: string;
}> = ({
  points,
  height = 220,
  color = "#10b981",
  valueFormatter = (v) => v.toLocaleString(),
  emptyMessage = "No data yet",
}) => {
  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">{emptyMessage}</p>
    );
  }

  const width = 600; // viewBox units — scales responsively via the svg element
  const padTop = 20;
  const padBottom = 28;
  const padX = 12;
  const innerHeight = height - padTop - padBottom;
  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX =
    points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padX + i * stepX;
    const y = padTop + innerHeight - (p.value / max) * innerHeight;
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
    padTop + innerHeight
  ).toFixed(
    1,
  )} L ${coords[0].x.toFixed(1)} ${(padTop + innerHeight).toFixed(1)} Z`;

  const gradientId = "area-trend-gradient";

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* horizontal guide lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padTop + innerHeight * f}
            y2={padTop + innerHeight * f}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={4}
              fill="white"
              stroke={color}
              strokeWidth={2}
            >
              <title>
                {new Date(c.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                : {valueFormatter(c.value)}
              </title>
            </circle>
            <text
              x={c.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-400"
              style={{ fontSize: 11 }}
            >
              {new Date(c.date).toLocaleDateString(undefined, {
                weekday: "short",
              })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
