import { ExternalLink } from "lucide-react";
import type { CompetitorProfile } from "@/lib/types";
import { Panel } from "@/components/decor/Panel";

export function CompetitorCard({ competitor }: { competitor: CompetitorProfile }) {
  return (
    <Panel
      eyebrow={`Competitor No. ${String(competitor.ranking).padStart(2, "0")}`}
      meta={`${competitor.matchScore}% Match`}
    >
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold text-navy-800">
          {competitor.name}
        </h3>
        <a
          href={competitor.website}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-navy-400 hover:text-brass-600"
        >
          {competitor.website.replace(/^https?:\/\//, "")}
          <ExternalLink size={11} />
        </a>

        <p className="mt-4 text-sm leading-relaxed text-navy-500">{competitor.summary}</p>

        <div className="mt-4 grid gap-4 border-t border-navy-600 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
              Estimated scale
            </p>
            <p className="mt-1 text-sm text-navy-800">{competitor.estimatedSalesTier}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
              Advertising channels
            </p>
            <p className="mt-1 text-sm text-navy-800">
              {competitor.advertisingChannels.join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-navy-600 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
            Sales strategy
          </p>
          <p className="mt-1 text-sm leading-relaxed text-navy-500">
            {competitor.salesStrategy}
          </p>
        </div>

        <div className="mt-4 grid gap-4 border-t border-navy-600 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
              Strengths
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {competitor.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-navy-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brass-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
              Why they&rsquo;re succeeding
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {competitor.successFactors.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-navy-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy-300" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Panel>
  );
}
