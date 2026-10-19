import { Panel } from "@/components/decor/Panel";
import type { BacklinkRow } from "@/lib/audit/schema";

const num = (n: number | null) => (n === null ? "n/a" : n.toLocaleString("en-US"));

export function BacklinksPanel({ rows, clientDomain }: { rows: BacklinkRow[]; clientDomain: string | null }) {
  const sorted = [...rows].sort((a, b) => (b.rank ?? -1) - (a.rank ?? -1));
  return (
    <Panel eyebrow="Backlinks and authority" meta={`${rows.length} sites`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-600 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">
              <th className="px-5 py-3 font-normal">Website</th>
              <th className="px-3 py-3 font-normal">Domain rank</th>
              <th className="px-3 py-3 font-normal">Backlinks</th>
              <th className="px-5 py-3 font-normal">Referring domains</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isClient = r.domain === clientDomain;
              return (
                <tr key={r.domain} className={`border-b border-navy-300/60 ${isClient ? "bg-brass-200/40" : ""}`}>
                  <td className="px-5 py-3 font-medium text-navy-800">
                    {r.domain}
                    {isClient && <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-brass-600">You</span>}
                  </td>
                  {r.ok ? (
                    <>
                      <td className="px-3 py-3 text-navy-700">{num(r.rank)} / 100</td>
                      <td className="px-3 py-3 text-navy-700">{num(r.backlinks)}</td>
                      <td className="px-5 py-3 text-navy-700">{num(r.referringMainDomains ?? r.referringDomains)}</td>
                    </>
                  ) : (
                    <td colSpan={3} className="px-3 py-3 text-xs text-navy-400">
                      {r.error}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-navy-300/60 px-5 py-3 text-xs leading-relaxed text-navy-400">
        Domain rank is DataForSEO&rsquo;s own 0 to 100 authority score. It is similar in spirit to Ahrefs DR or
        Moz DA, but the numbers are not directly comparable. More referring domains than your competitors usually means stronger authority.
      </p>
    </Panel>
  );
}
