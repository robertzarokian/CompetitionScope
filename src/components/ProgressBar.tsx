"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-navy-400">
        <span>
          Reading {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="text-brass-600">{Math.round(pct)}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-sm border border-navy-300 bg-cream-200">
        <div
          className="h-full bg-brass-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-0 flex justify-between px-[1px]"
          aria-hidden="true"
        >
          {Array.from({ length: total - 1 }).map((_, i) => (
            <span key={i} className="h-full w-px bg-cream-100/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
