import React from "react";

interface Point {
  date: string;
  revenue: number;
}

// Simple CSS vertical bar chart — no chart library dependency
export const DailyTrendChart: React.FC<{ points: Point[] }> = ({ points }) => {
  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        No sales in this period
      </p>
    );
  }

  const max = Math.max(...points.map((p) => p.revenue), 1);

  return (
    <div className="flex h-48 items-stretch gap-1.5 overflow-x-auto pb-1">
      {points.map((p) => {
        const heightPercent = Math.max((p.revenue / max) * 100, 2);
        const label = new Date(p.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        return (
          <div
            key={p.date}
            className="group relative flex min-w-28px flex-1 flex-col items-center"
          >
            {/* bar area — flex-1 gives this a definite pixel height (container
                is h-48), which the bar below needs so its %-height resolves */}
            <div className="relative flex w-full flex-1 flex-col justify-end">
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                {p.revenue.toLocaleString()} Ks
              </div>
              <div
                className="w-full rounded-t-md bg-emerald-500 transition-all group-hover:bg-emerald-600"
                style={{ height: `${heightPercent}%` }}
              />
            </div>
            <span className="mt-1.5 shrink-0 whitespace-nowrap text-[10px] text-slate-400">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
