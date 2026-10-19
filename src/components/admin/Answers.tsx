import { fmtDate } from "./AdminShell";

interface Answers {
  email?: string;
  companyName?: string;
  website?: string;
  category?: string;
  description?: string;
  struggles?: string;
  salesConfidence?: string;
  potentialGap?: string;
  knownCompetitors?: string;
  marketingChannels?: string[];
}

// Every answer a customer gave in the questionnaire, plus how their report turned out.
export function ReportAnswers({
  id,
  createdAt,
  source,
  unlocked,
  answers,
  competitors,
}: {
  id: string;
  createdAt: Date;
  source: string;
  unlocked: boolean;
  answers: Answers;
  competitors: string[];
}) {
  const rows: [string, string][] = [
    ["Email", answers.email ?? ""],
    ["Company", answers.companyName ?? ""],
    ["Website", answers.website ?? ""],
    ["Category", answers.category ?? ""],
    ["What they provide", answers.description ?? ""],
    ["Biggest struggle", answers.struggles ?? ""],
    ["Sales confidence", answers.salesConfidence ?? ""],
    ["Performance vs potential", answers.potentialGap ?? ""],
    ["Competitors they know", answers.knownCompetitors ?? ""],
    ["Marketing channels", (answers.marketingChannels ?? []).join(", ")],
    ["Competitors we found", competitors.join(", ")],
  ];
  return (
    <details className="group border border-navy-300/60 bg-cream-50">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-navy-800">{answers.companyName || "(no company name)"}</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-navy-400">
          {fmtDate(createdAt)} · {source === "ai" ? "AI report" : "sample report"} · {unlocked ? "bought" : "preview"}
        </span>
      </summary>
      <dl className="grid gap-x-6 gap-y-3 border-t border-navy-300/60 px-4 py-4 text-sm sm:grid-cols-[180px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-[11px] uppercase tracking-wide text-navy-400">{k}</dt>
            <dd className="whitespace-pre-wrap break-words text-navy-800">{v || "n/a"}</dd>
          </div>
        ))}
        <dt className="font-mono text-[11px] uppercase tracking-wide text-navy-400">Report id</dt>
        <dd className="break-all font-mono text-xs text-navy-500">{id}</dd>
      </dl>
    </details>
  );
}
