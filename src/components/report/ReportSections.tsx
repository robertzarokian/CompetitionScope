import { Layers } from "lucide-react";
import type { RoadmapItem, SuccessFactor } from "@/lib/types";

export function SuccessFactorCard({ factor }: { factor: SuccessFactor }) {
  return (
    <div className="paper-panel border border-navy-600 p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-display text-base font-semibold text-navy-800">
          {factor.title}
        </h4>
        <span className="shrink-0 border border-brass-400/40 bg-brass-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-brass-600">
          {factor.competitorsSharingIt} competitor
          {factor.competitorsSharingIt === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy-500">{factor.description}</p>
    </div>
  );
}

const IMPACT_STYLES: Record<string, string> = {
  high: "text-brass-600 border-brass-400/40 bg-brass-400/10",
  medium: "text-navy-500 border-navy-300 bg-cream-200",
  low: "text-navy-400 border-navy-300 bg-cream-100",
};

export function RoadmapCard({ item }: { item: RoadmapItem }) {
  return (
    <div className="paper-panel flex gap-4 border border-navy-600 p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-brass-300 bg-brass-400 font-display text-sm font-bold text-navy-950">
        {item.priority}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-base font-semibold text-navy-800">
            {item.title}
          </h4>
          <span
            className={`border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${IMPACT_STYLES[item.impact]}`}
          >
            {item.impact} impact
          </span>
          <span className="flex items-center gap-1 border border-navy-300 bg-cream-200 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-navy-400">
            <Layers size={10} />
            {item.effort} effort
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-navy-500">{item.description}</p>
      </div>
    </div>
  );
}
