import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown } from "lucide-react";
import { Panel } from "@/components/decor/Panel";
import type { CheckRow, CheckStatus } from "@/lib/audit/schema";

const ICONS: Record<CheckStatus, { Icon: typeof Info; className: string; label: string }> = {
  good: { Icon: CheckCircle2, className: "text-emerald-700", label: "Good" },
  warn: { Icon: AlertTriangle, className: "text-brass-600", label: "Needs attention" },
  bad: { Icon: XCircle, className: "text-red-700", label: "Problem" },
  info: { Icon: Info, className: "text-navy-400", label: "For your information" },
};

export function SiteChecksPanel({ checks, note }: { checks: CheckRow[]; note: string | null }) {
  const sorted = [...checks].sort((a, b) => a.n - b.n);
  return (
    <Panel eyebrow="Website checks" meta={`${sorted.length} checks`}>
      <ul className="divide-y divide-navy-300/60">
        {sorted.map((c) => {
          const { Icon, className, label } = ICONS[c.status];
          const hasDetails = c.details.length > 0;
          return (
            <li key={c.n} className="px-5 py-4">
              <details className="group">
                <summary
                  className={`flex list-none items-start gap-3 [&::-webkit-details-marker]:hidden ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
                  onClick={hasDetails ? undefined : (e) => e.preventDefault()}
                >
                  <Icon size={18} className={`mt-0.5 shrink-0 ${className}`} aria-label={label} />
                  <div className="flex-1">
                    <p className="font-display text-sm font-semibold text-navy-800">{c.title}</p>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-navy-500">{c.summary}</p>
                  </div>
                  {hasDetails && (
                    <ChevronDown size={16} className="mt-1 shrink-0 text-navy-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                  )}
                </summary>
                {hasDetails && (
                  <ul className="mt-3 space-y-1.5 pl-8">
                    {c.details.map((d, i) => (
                      <li key={i} className="break-words font-mono text-[11.5px] leading-relaxed text-navy-500">
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </li>
          );
        })}
      </ul>
      {note && <p className="border-t border-navy-300/60 px-5 py-3 font-mono text-[11px] text-navy-400">{note}</p>}
    </Panel>
  );
}
