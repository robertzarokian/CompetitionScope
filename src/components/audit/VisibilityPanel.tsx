import { ExternalLink, ChevronDown } from "lucide-react";
import { Panel } from "@/components/decor/Panel";
import type { Analysis, BrandStat } from "@/lib/audit/analysis";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="paper-panel border border-navy-600 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy-400">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold text-navy-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-navy-500">{sub}</p>}
    </div>
  );
}

function BrandRow({ rank, brand, answers }: { rank: number; brand: BrandStat; answers: number }) {
  return (
    <tr className={`border-b border-navy-300/60 ${brand.isClient ? "bg-brass-200/40" : ""}`}>
      <td className="px-5 py-3 font-display text-base font-semibold text-brass-500">{rank}</td>
      <td className="px-3 py-3 font-medium text-navy-800">
        {brand.name}
        {brand.isClient && <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-brass-600">You</span>}
        {brand.isListedCompetitor && (
          <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-navy-400">Your competitor</span>
        )}
      </td>
      <td className="px-3 py-3 text-navy-700">
        {brand.mentions} of {answers}
      </td>
      <td className="px-5 py-3 text-navy-700">{brand.avgPosition === null ? "n/a" : brand.avgPosition.toFixed(1)}</td>
    </tr>
  );
}

export function VisibilityPanel({
  analysis,
  errors,
  runsPerQuestion,
}: {
  analysis: Analysis;
  errors: string[];
  runsPerQuestion: number;
}) {
  const { client, answers } = analysis;
  const leaders = analysis.topBrands.filter((b) => !b.isClient).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="You were recommended"
          value={`${client.mentions} of ${answers}`}
          sub={client.mentions === 0 ? "AI did not name your company" : "AI answers that named your company"}
        />
        <Stat
          label="Average position"
          value={client.avgPosition === null ? "None" : client.avgPosition.toFixed(1)}
          sub={client.avgPosition === null ? "Not in any list" : `Best position: ${client.bestPosition}`}
        />
        <Stat label="Platforms checked" value={analysis.providers.join(", ") || "None"} sub={`${answers} answers read`} />
      </div>

      {analysis.questions.map((q) => (
        <Panel key={q.question} eyebrow="Question" meta={`${q.answers} answer${q.answers === 1 ? "" : "s"}`}>
          <div className="px-5 pt-4">
            <p className="font-display text-base font-semibold text-navy-800">&ldquo;{q.question}&rdquo;</p>
            <p className="mt-1 text-[13px] text-navy-500">
              {q.clientMentions === 0
                ? "Your company was not recommended for this question."
                : `Your company was recommended in ${q.clientMentions} of ${q.answers} answers, best position ${q.clientBestPosition}.`}
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-y border-navy-600 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">
                  <th className="px-5 py-2.5 font-normal">Rank</th>
                  <th className="px-3 py-2.5 font-normal">Company</th>
                  <th className="px-3 py-2.5 font-normal">Recommended in</th>
                  <th className="px-5 py-2.5 font-normal">Avg. position</th>
                </tr>
              </thead>
              <tbody>
                {q.top.map((b, i) => (
                  <BrandRow key={b.key} rank={i + 1} brand={b} answers={q.answers} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}

      <Panel eyebrow="Why they rank" meta="Approximate">
        <div className="grid gap-8 p-5 lg:grid-cols-2">
          <div>
            <p className="font-display text-base font-semibold text-navy-800">What kinds of websites back the top 5</p>
            <p className="mt-1 text-[13px] text-navy-500">
              Share of the sources AI used when recommending the leading companies.
            </p>
            <ul className="mt-4 space-y-3">
              {analysis.sourceTypes.map((t) => (
                <li key={t.type}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-navy-800">{t.type}</span>
                    <span className="font-mono text-[11px] text-brass-600">{Math.round(t.share * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-navy-100">
                    <div className="h-full bg-brass-400" style={{ width: `${Math.max(3, Math.round(t.share * 100))}%` }} />
                  </div>
                </li>
              ))}
              {analysis.sourceTypes.length === 0 && <li className="text-sm text-navy-400">No sources were reported.</li>}
            </ul>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-navy-800">The websites cited most</p>
            <ul className="mt-4 space-y-2.5">
              {analysis.topDomains.map((d) => (
                <li key={d.domain} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="break-all font-medium text-navy-800">{d.domain}</span>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-navy-400">{d.type}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-brass-600">
                    {d.brands.length} {d.brands.length === 1 ? "company" : "companies"}
                  </span>
                </li>
              ))}
              {analysis.topDomains.length === 0 && <li className="text-sm text-navy-400">No sources were reported.</li>}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Sources behind each leading company" meta={`${leaders.length} companies`}>
        <ul className="divide-y divide-navy-300/60">
          {leaders.map((b) => (
            <li key={b.key} className="px-5 py-4">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="font-display text-sm font-semibold text-navy-800">{b.name}</span>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-navy-400">
                      {b.sources.length} source{b.sources.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-navy-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="mt-3 space-y-2">
                  {b.sources.map((s) => (
                    <li key={s.url} className="text-[13px]">
                      <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-start gap-1.5 break-words text-navy-700 hover:text-brass-600">
                        <ExternalLink size={12} className="mt-1 shrink-0" />
                        <span>{s.title || s.domain}</span>
                      </a>
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-navy-400">
                        {s.domain} · {s.type}
                      </span>
                    </li>
                  ))}
                  {b.sources.length === 0 && <li className="text-[13px] text-navy-400">No specific sources were tied to this company.</li>}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </Panel>

      {analysis.advice.length > 0 && (
        <div className="instrument-panel card-glow p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-400">What to do</p>
          <ul className="mt-4 space-y-3">
            {analysis.advice.map((a) => (
              <li key={a} className="flex gap-3 text-sm leading-relaxed text-cream-100">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-brass-400" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs leading-relaxed text-navy-400">
        {`How to read this: each AI platform was asked each question ${runsPerQuestion} ${runsPerQuestion === 1 ? "time" : "times"} through its developer interface with web search turned on. Answers can differ a little from what people see in the consumer apps, and they change from run to run, so this shows how often you appear rather than one fixed rank. Source types are estimated from each website's domain.`}
        {analysis.failed > 0 && ` ${analysis.failed} ${analysis.failed === 1 ? "check" : "checks"} could not be completed.`}
      </p>
      {errors.length > 0 && (
        <ul className="space-y-1 text-xs text-navy-400">
          {Array.from(new Set(errors)).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
