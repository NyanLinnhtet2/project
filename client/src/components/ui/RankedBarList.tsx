import React from "react";

export interface RankedBarItem {
  label: string;
  sublabel?: string;
  value: number;
  valueLabel: string;
}

export const RankedBarList: React.FC<{
  items: RankedBarItem[];
  barColorClass?: string;
  emptyMessage?: string;
}> = ({ items, barColorClass = "bg-emerald-500", emptyMessage = "No data yet" }) => {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyMessage}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              {item.label}
              {item.sublabel && (
                <span className="ml-1.5 text-xs text-slate-400">{item.sublabel}</span>
              )}
            </span>
            <span className="font-semibold text-slate-700">{item.valueLabel}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${barColorClass}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};